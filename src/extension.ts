import * as vscode from 'vscode';
import axios from 'axios';

/**
 * Fetches the latest news from Hacker News API.
 * @returns A promise that resolves to an array of news stories.
 */
async function getLatestNews(): Promise<any[]> {
    try {
        const response = await axios.get('https://hacker-news.firebaseio.com/v0/topstories.json');
        const storyIds = response.data.slice(0, 5);

        const stories = await Promise.all(
            storyIds.map(async (storyId: any) => {
                const storyResponse = await axios.get(`https://hacker-news.firebaseio.com/v0/item/${storyId}.json`);
                return storyResponse.data;
            })
        );
        return stories;
    } catch (error) {
        throw error;
    }
}

/**
 * Creates HTML markup for a news story entry.
 * @param entryObject - The news story object.
 * @param index - The index of the entry.
 * @returns HTML markup for the news story.
 */
function createNewEntry(entryObject: any, index: number): string {
    const {
        id,
        url,
        title,
        score,
        by,
        descendants
    } = entryObject;

    const rank = index + 1;
    const hostname = url.match(/\/\/([^/]+)/)[1];

    return `
        <tr class="athing" id="${id}">
            <td align="right" valign="top" class="title">
                <span class="rank">${rank}.</span>
            </td>
            <td valign="top" class="votelinks">
                <center>
                    <a id="up_${id}" class="clicky" href="vote?id=${id}&amp;how=up&amp;auth=bd71bd092c4aa0fd3d7ff81215d311ce8ae2698d&amp;goto=news">
                        <div class="votearrow" title="upvote"></div>
                    </a>
                </center>
            </td>
            <td class="title">
                <span class="titleline">
                    <a href="${url}" rel="noreferrer">${title}</a>
                    <span class="sitebit comhead">
                        (<a href="from?site=${hostname}">
                            <span class="sitestr">${hostname}</span>
                        </a>)
                    </span>
                </span>
            </td>
        </tr>
        <tr>
            <td colspan="2"></td>
            <td class="subtext">
                <span class="subline">
                    <span class="score" id="score_${id}">${score} points</span>
                    by <a href="user?id=akyuu" class="hnuser">${by}</a>
                    <span class="age" title="2023-10-06T20:15:17">
                        | <a href="item?id=37795751">${descendants}&nbsp;comments</a>
                    </span>
                </span>
            </td>
        </tr>
        <tr class="spacer" style="height:5px"></tr>
    `;
}


/**
 * Generates the HTML content for the webview.
 * @param styleSrc - The URI for the stylesheet.
 * @param entriesBlock - The HTML markup for news story entries.
 * @returns HTML content for the webview.
 */
function getWebviewContent(styleSrc: vscode.Uri, entriesBlock: string): string {
    return `
        <html lang="en" op="news">
        <head>
            <meta name="referrer" content="origin">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" type="text/css" href="${styleSrc}">
            <link rel="shortcut icon" href="favicon.ico">
            <link rel="alternate" type="application/rss+xml" title="RSS" href="rss">
            <title>Hacker News</title>
        </head>
        <body>
            <center>
                <table id="hnmain" border="0" cellpadding="0" cellspacing="0" width="85%" bgcolor="#f6f6ef">
                    <tbody>
                        <tr>
                            <td bgcolor="#ff6600">
                                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="padding:2px">
                                    <tbody>
                                        <tr>
                                            <td style="width:18px;padding-right:4px">
                                                <a href="https://news.ycombinator.com">
                                                    <img src="https://news.ycombinator.com/y18.svg" width="18" height="18" style="border:1px white solid; display:block">
                                                </a>
                                            </td>
                                            <td style="line-height:12pt; height:10px;">
                                                <span class="pagetop"><b class="hnname"><a href="news">Hacker News</a></b>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                        <tr id="pagespace" title="" style="height:10px"></tr>
                        <tr>
                            <td>
                                <table border="0" cellpadding="0" cellspacing="0">
                                    <tbody>
                                        ${entriesBlock}
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </center>
            <script type="text/javascript" src="hn.js?SexOfNod93gCxpDAednj"></script>
        </body>
        </html>
    `;
}


/**
 * Activates the VSCode extension.
 * @param context - The extension context.
 */
function activate(context: vscode.ExtensionContext) {
    console.log('This is my new Hacker News extension');

    let disposable = vscode.commands.registerCommand('some-test-extension.getLatestHackerNews', async () => {
        try {
            const news = await getLatestNews();
            const entriesBlock = news
                .map((entry, index) => createNewEntry(entry, index))
                .reduce((acc, curr) => acc + curr, '');

            const panel = vscode.window.createWebviewPanel(
                'some-test-extension',
                'Hacker News',
                vscode.ViewColumn.One,
                {}
            );

            const onDiskPath = vscode.Uri.joinPath(context.extensionUri, 'style.css');
            const styleSrc = panel.webview.asWebviewUri(onDiskPath);

            panel.webview.html = getWebviewContent(styleSrc, entriesBlock);
        } catch (error: any) {
            vscode.window.showErrorMessage('Failed to fetch Hacker News: ' + error.message);
        }
    });

    context.subscriptions.push(disposable);
}

/**
 * Deactivates the VSCode extension.
 */
function deactivate() {}

export {
    activate,
    deactivate
};
