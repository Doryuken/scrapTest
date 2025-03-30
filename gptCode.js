const { sleep, convertToCSV } = require("./helpers");
const fs = require('fs');
const path = require('path');

async function writeToGPT(page, textToWrite, msgTurn) {
    await page.evaluate((textToWrite) => document.querySelector("#prompt-textarea > p").textContent = textToWrite, [textToWrite]);
    await page.evaluate(() => {
        let p = document.querySelector("#prompt-textarea > p");
        p.setAttribute('tabindex', '0');
        p.focus();
    })
    await page.keyboard.press('Enter');


    await waitForChatGPTResponse(page);
    const response = await page.evaluate((msgTurn) => document.getElementsByClassName("group/conversation-turn agent-turn")[msgTurn].innerText, [msgTurn]);
    return { response, textToWrite };
}
async function waitForChatGPTResponse(page) {
    console.log("ChatGPT is thinking...");

    await page.waitForSelector('.markdown', { visible: true });

    let prevText = "";
    let stableCount = 0;

    while (stableCount < 3) { // Ensure stability by checking 3 consecutive times
        await sleep(1000); // Small delay
        const newText = await page.evaluate(() => {
            return [...document.querySelectorAll('.markdown')].pop()?.innerText.trim() || "";
        });

        if (newText === prevText) {
            stableCount++; // Increment if text hasn't changed
        } else {
            stableCount = 0; // Reset if text is still updating
            prevText = newText;
        }
    }
    return prevText;
}



async function askQuestion(rl, page, browser, msgTurn,chatData) {
    return new Promise((resolve, reject) => {
        rl.question('You: ', async (input) => {
            if (input.toLowerCase() === 'exit') {
                console.log("\x1b[43m GoodBye!!! \x1b[0m")
                rl.close();
                await browser.close();
                resolve(null); // Exit gracefully
                return;
            }
            else if (input.toLowerCase() === 'csv') {
                try {
                    const csvData = convertToCSV(chatData);
                    const filePath = path.join(__dirname, 'chat_data.csv');
                    fs.writeFileSync(filePath, csvData,{encoding : 'utf8'});
                    console.log("\x1b[42m CSV file saved at: " + filePath + "\x1b[0m");
                    resolve(null); // Prevent infinite loop
                } catch (error) {
                    console.error("Error writing CSV:", error);
                    reject(error);
                }
                return;
            }

            try {
                const { response, textToWrite } = await writeToGPT(page, input, msgTurn);
                resolve({ answer: response, question: textToWrite });
            } catch (error) {
                reject(error);
            }
        });
    });
}


module.exports = { askQuestion, waitForChatGPTResponse, writeToGPT }