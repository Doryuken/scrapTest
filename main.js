const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { executablePath } = require('puppeteer');
const readline = require('readline');

const { cleanAnswer, checkIfConnected } = require('./helpers');
const { askQuestion } = require('./gptCode');
const { getCredentials, getCode } = require('./prompt');
puppeteer.use(StealthPlugin());

let msgTurn = 0;

let chatData = [{
    question: "",
    answer: ""
}];

// Create a terminal interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

(async () => {
    const browser = await puppeteer.launch({ headless: true, executablePath: executablePath() });
    const page = await browser.newPage();
    try {

        console.log("\x1b[32mThe BOT is launched! \x1b[0m")
        await page.goto('https://chat.openai.com/', { waitUntil: 'networkidle2' });


        // Click on login button
        await page.waitForSelector('button[data-testid="login-button"]', { visible: true });
        await page.click('button[data-testid="login-button"]');
        // Wait for email input

        await page.waitForSelector('input[id="email-input"]', { visible: true });
        const { email, password } = await getCredentials(rl);
        await page.type('input[id="email-input"]', email); // Replace with your email

        await page.click('input[name="continue"]');
        const correctMail = await page.evaluate(() => !document.body?.innerText?.includes("Email is not valid"));
        if (!correctMail) throw "Email is not valid, closing the BOT.";
        // Wait for password input
        await page.waitForSelector('input[id="password"]', { visible: true });
        await page.type('input[id="password"]', password); // Replace with your password

        await page.evaluate(() => document.getElementsByTagName("form")[0].submit());

        // Wait for login to complete
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        const isNextStep = await page.evaluate(() => !document.body.innerText.includes("Incorrect email address, phone number, or password. Phone numbers must include the country code."));
        if(!isNextStep) throw "Password or email incorrect ! Maybe a typo ? who knows ...";
        if (!(await checkIfConnected(page))) {
            console.log("\x1b[31mEmail confirmation required!\x1b[0m")
            // throw "Require email confirmation :( ...";
            const code = await getCode(rl);
            await page.waitForSelector('input[type="number"]', { visible: true });
            await page.type('input[type="number"]', code);
            await page.click('button[type="submit"]');
            await page.waitForSelector("#prompt-textarea > p");
        }
        console.log("\x1b[32mLogged in successfully! \x1b[0m");
        while (true) {
            let response = await askQuestion(rl, page, browser, msgTurn,chatData);
            if (response === null) break;

            let { answer, question } = response;
            if (answer === null) break;

            if (typeof answer === 'string') {
                console.log("\x1b[35mGPT says : " + cleanAnswer(answer) + "\x1b[0m");
                if (!chatData[msgTurn]) chatData[msgTurn] = {}; 
                chatData[msgTurn]["question"] = question;
                chatData[msgTurn]["answer"] = cleanAnswer(answer);
                msgTurn++;
            } else {
                throw new Error("Answer not type of string, ERROR...");
            }
        }
    } catch (e) {
        console.log("\x1b[41m " + e + " \x1b[0m")
        await browser.close();
        rl.close();
    }
    finally {
        console.log("\x1b[42m Hope you had fun !\x1b[0m")
        await browser.close();
        rl.close();
    }
})();



