async function getCredentials(rl) {
    const email = await ask(rl,"📧 Enter your email: ");
    const password = await ask(rl,"🔑 Enter your password: ", true);
    return { email, password };
}


async function getCode(rl) {
    const code = await ask(rl,"X Enter email verification code: ");
    return code;
}


const ask = (rl,query) => {
    return new Promise((resolve) =>
        rl.question(query, resolve)
    );
};

module.exports = {ask,getCode,getCredentials}