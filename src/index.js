// Import required modules
const express = require('express');
const session = require('express-session');
let FileStore = require('session-file-store')(session);

const fs = require("fs")
const child_process = require('child_process');
const bodyParser = require('body-parser');

const { v4: uuidv4 } = require('uuid');
function makeid(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
}



const crypto = require('crypto');

function encrypt(text, password) {
    const salt = crypto.randomBytes(16);
    const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha512');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return salt.toString('hex') + iv.toString('hex') + encrypted + authTag;
}
function decrypt(encryptedText, password) {
    try {
        const salt = Buffer.from(encryptedText.slice(0, 32), 'hex');
        const iv = Buffer.from(encryptedText.slice(32, 64), 'hex');
        const encrypted = encryptedText.slice(64, -32);
        const authTag = Buffer.from(encryptedText.slice(-32), 'hex');
        const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha512');
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch(err) { 
        return ""
    }
}



let challengeList = []
let currentChallenge = { current: "asdf" }
function loadFiles() {
    console.log("Reading JSON Files")
    currentChallenge = JSON.parse(fs.readFileSync("./data/current.json"))
    challengeList = JSON.parse(fs.readFileSync("./data/challenges.json"))
}
function writeFiles() {
    console.log("Writing JSON Files")
    fs.writeFileSync("./data/current.json", JSON.stringify(currentChallenge))
    fs.writeFileSync("./data/challenges.json", JSON.stringify(challengeList))
}



const app = express();
const port = 8080;

app.set('view engine', 'pug');
app.set('views', __dirname + '/views');

app.use(express.json());

let fileStoreOptions = {};
app.use(session({
    secret: 'cat videos',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
    store: new FileStore(fileStoreOptions)
}));
app.use('/static', express.static('./src/static'))


app.get("/", async (req, res) => {
    if (!req.session.uuid) {
        req.session.uuid = makeid(15);
    }
    req.session.challenge = getCurrentChallenge();
    res.render('solve', {
        challenge: JSON.stringify(req.session.challenge), 
        userID: JSON.stringify(req.session.uuid),
        otherChallenges: JSON.stringify(getAllVisableChallenges())
    });
})
app.get("/challenge/:challengeID", async (req, res) => {
    if (!req.session.uuid) {
        req.session.uuid = makeid(15);
    }
    if (req.params.challengeID) {
        req.session.challenge = getChallengeFromID(req.params.challengeID)
    } else {
        req.session.challenge = getCurrentChallenge();
    }
    res.render('solve', {
        challenge: JSON.stringify(req.session.challenge), 
        userID: JSON.stringify(req.session.uuid),
        otherChallenges: JSON.stringify(getAllVisableChallenges())
    });
})

app.get("/admin/login", async (req, res) => {
    if (req.session.isAdmin) {
        res.redirect("/admin/view")
        return
    }
    res.render("login")
})
app.get("/admin/view", async (req, res) => {
    if (!req.session.isAdmin) {
        res.redirect("/admin/login");
        return;
    }
    res.redirect("/admin/view/" + getCurrentChallengeID())
})
app.get("/admin/view/:ID", async (req, res) => {
    if (!req.session.isAdmin) {
        res.redirect("/admin/login");
        return;
    }
    res.render("admin", {
        userID: JSON.stringify(req.session.uuid),
        challenge: JSON.stringify(getChallengeFromID(req.params.ID)),
        currentChallengeID: JSON.stringify(getCurrentChallengeID()),
        allChallenges: JSON.stringify(getAllChallenges())
    })
})


function createUser(username, pass) {
    let newUser = encrypt(username, pass)
    let users = JSON.parse(fs.readFileSync("./data/users.json"))
    users.push(newUser)
    fs.writeFileSync("./data/users.json", JSON.stringify(users))
};
app.post('/login', async (req, res) => {
    // Insert Login Code Here

    let users = JSON.parse(fs.readFileSync("./data/users.json"))
    let found = false;
    users.forEach(user => {
        if (decrypt(user, req.body.password) == req.body.username) {
            found = true;
        }   
    });
    if (!found) {
        req.session.isAdmin = false;
        res.status(401);
        res.send('None shall pass');
        return;
    }
    req.session.isAdmin = true;
    setTimeout(() => {
        res.status(200);
        res.send('Ok');
    }, 200);
});


app.post("/setCurrent", async (req, res) => {
    if (!req.session.isAdmin) { res.status(401); res.send('None shall pass'); return;}
    setCurrentChallengeID(req.body.uuid)
    res.status(200)
    res.send("OK")
})
app.post("/save", async (req, res) => {
    if (!req.session.isAdmin) { res.status(401); res.send('None shall pass'); return;}
    saveChallenge(req.body.id, req.body)
    res.status(200)
    res.send("OK")
})
app.post("/deleteChallenge", async (req, res) => {
    if (!req.session.isAdmin) { res.status(401); res.send('None shall pass'); return;}
    deleteChallenge(req.body.uuid)
    res.status(200)
    res.send("OK")
})


// Return Types:
// void, boolean, int, double

function getCurrentChallengeID() {    
    return currentChallenge.current
}
function setCurrentChallengeID(uuid) {
    currentChallenge.current = uuid
    writeFiles()
}

function getCurrentChallenge() {
    return getChallengeFromID(getCurrentChallengeID())
}
function getChallengeFromID(uuid) {
    let challenges = challengeList
    let foundChallenge = null;
    challenges.forEach((challenge) => {
        if (challenge.id == uuid) {
            foundChallenge = challenge;
        }
    })
    return foundChallenge;
}
function getAllVisableChallenges() {
    let challenges = challengeList
    let foundChallenges =[]
    challenges.forEach((challenge) => {
        if (challenge.public == true) {
            foundChallenges.push({
                title: challenge.title,
                id: challenge.id
            })
        }
    })
    return foundChallenges;
}
function getAllChallenges() {
    return challengeList
}
function saveChallenge(uuid, challenge) {
    let chals = getAllChallenges()
    let found = false;
    for (let i = 0; i < chals.length; i++) {
        if (chals[i].id == uuid) {
            chals[i] = challenge;
            found = true;
            break;
        }
    }
    if (!found) {
        chals.push(challenge)
    }
    challengeList = chals;
    writeFiles()
}
function deleteChallenge(uuid) {
    let chals = getAllChallenges()
    let found = false;
    for (let i = 0; i < chals.length; i++) {
        if (chals[i].id == uuid) {
            chals.splice(i, 1);
            found = true;
            break;
        }
    }
    if (found) {
        challengeList = chals;
        writeFiles()
        if (uuid == getCurrentChallengeID()) {
            setCurrentChallengeID(chals[0].id)
        }
    }
    return found;
}


// Java Execution Functions
function genConsoleLog(inside) {
    return `System.out.println(${inside});`
}
function generateFullCode(innerCode, userID, challengeID) {
    let challenge = getChallengeFromID(challengeID)
    
    let argsString = ""
    for (let i = 0; i < challenge.parameters.length; i++) {
        argsString += `${challenge.parameters[i].type} ${challenge.parameters[i].name}`
        if (i + 1 != challenge.parameters.length) {
            argsString += ", "
        }
    }

    let testsString = "";
    let testNum = 0;
    challenge.tests.forEach((test) => {
        let args = "";
        for (let i = 0; i < test.args.length; i++) {
            args += test.args[i]
            if (i + 1 != test.args.length) {
                args += ", "
            }
        }
        if (challenge.returnType == "boolean") {
            testsString += genConsoleLog(`"- ${testNum} " + (${challenge.name}(${args}) ? "true" : "false")`);
        }
        if (challenge.returnType == "double" || challenge.returnType == "int") {
            testsString += genConsoleLog(`"- ${testNum} " + ${challenge.name}(${args})`);
        }
        if (challenge.returnType == "void") {
            testsString += `${challenge.name}(${args});`;
        }
        testNum++;
    })


    return `
    class ${userID} {
        public static void main(String[] args) {
            ${testsString}
        }

        public static ${challenge.returnType} ${challenge.name}(${argsString}) {
            ${innerCode}
        };
    } 
    `

}
async function executeJava(javaCode, userID, challengeID) {
    return new Promise((resolve) => {
        let fullCode = generateFullCode(javaCode, userID, challengeID);
        console.log(" ")
        console.log("Running: ", fullCode)
        fs.writeFileSync("./java/" + userID + ".java", fullCode)

        let process = child_process.exec("cd java/ && javac " + userID + ".java && java " + userID);

        let returnString = ""

        process.stdout.on("data", (data) => {
            returnString += data;
        })
        process.stderr.on("data", (data) => {
            returnString += data;
        })
        process.on("close", (code) => {
            try {fs.unlinkSync("java/" + userID + ".java")} catch(err) { console.log(err) }
            try {fs.unlinkSync("java/" + userID + ".class")} catch(err) { console.log(err) }
            resolve(returnString)
        })
    }) 
}
app.post('/execute', async (req, res) => {
    const { javaCode } = req.body;
    const result = await executeJava(javaCode, req.session.uuid, req.session.challenge.id);
    console.log(result)
    res.send(result);
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    if (process.argv.length == 4) {
        createUser(process.argv[2], process.argv[3])
        console.log("Created User: " + process.argv[2])
    }

    loadFiles()
});
