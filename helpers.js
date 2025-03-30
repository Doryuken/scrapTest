function sleep(time) {
    return new Promise(function (resolve) {
        setTimeout(resolve, time)
    });
}
function cleanAnswer(answer) {
    return answer.replace("4o", '').replace("mini","").trim();
}
function convertToCSV(data) {
    if (!data.length) return '';

    const headers = "question,answer";  // Explicitly set headers

    const rows = data.map(({ question, answer }) => 
        `"${question.replace(/"/g, '""')}", "${answer.replace(/"/g, '""')}"`
    );

    return [headers, ...rows].join('\n');
}
async function checkIfConnected(page) {
    const check = await page.evaluate(() => document.body.innerHTML.includes("resendButton") && document.body.innerHTML.includes("Code"));
    if (check) return !check;
}
module.exports = {checkIfConnected,convertToCSV,cleanAnswer,sleep}