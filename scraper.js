var request = require("request");
const fs = require("fs")
const { v4: uuidv4 } = require('uuid');


let mainURL = "https://codingbat.com"

async function requestPage(url) {
    return new Promise(resolve => {
        request(url, function (error, response, body) {
            if (!error) {
                resolve(body)
            } else {
                console.log(error);
                resolve("")
            }
        });
    })
}
function parseCatgoryPage(html) {
    const indexes = [...html.matchAll(new RegExp("href='/prob/", 'gi'))].map(a => a.index);
    let links = []
    indexes.forEach(i => {
        links.push(mainURL + html.substring(i + 6, i + 19))
    })
    return links
};

function getWithinTheHTML(html, startPhrase, endPhrase) {
    let startIndex = html.indexOf(startPhrase)
    let endIndex = html.indexOf(endPhrase, startIndex)
    return html.substring(startIndex + startPhrase.length, endIndex)

}
function parseFunctionDecloration(functionString) {
    let array = functionString.split(" ")

    let argArray = []
    let splitFunc = functionString.split(",")
    
    if (splitFunc.length != 1) {
        // Multiple Parameters
        let firstArg = splitFunc[0].substring(splitFunc[0].indexOf("(") + 1, splitFunc[0].length).split(" ")
        argArray.push({
            name: firstArg[1],
            type: firstArg[0]
        })

        for (let i = 1; i < splitFunc.length; i++) {
            let otherArg = splitFunc[i].substring(splitFunc[i].indexOf("(") + 1, splitFunc[i].length).split(" ")

            let name = otherArg[2]
            if (i == splitFunc.length - 1) {
                name = name.substring(0, name.length - 1)
            }

            argArray.push({
                name: name,
                type: otherArg[1]
            })
        }
    } else {
        // One Parameter
        let parmString = getWithinTheHTML(splitFunc[0], "(", ")")
        let parmArray = parmString.split(" ")


        argArray.push({
            name: parmArray[1],
            type: parmArray[0]
        })
    }

    return {
        returnType: array[1],
        name: array[2].substring(0, array[2].indexOf("(")),
        args: argArray
    };
}
function parseFunctionTests(html) {
    let tests = []

    let testString = getWithinTheHTML(html, "</div><br>", "<p><button")
    let splitTestString = testString.split("<br>")
    splitTestString.forEach(str => {
        let parmText = getWithinTheHTML(str, "(", ")")
        let parmArray = parmText.split(", ")
        let resultSplit = str.split(" &rarr; ")
        tests.push({
            args: parmArray,
            returns: resultSplit[1]
        })
    })
    return tests
}

function parseChallenge(html) {

    let functionData = parseFunctionDecloration(getWithinTheHTML(html, "<form name=codeform><div id='ace_div'>", "</div>"))
    

    return {
        "id": uuidv4(),
        "public": true,
        "title": getWithinTheHTML(html, "<span class=h2>", "</span></a> &gt;") + " " + getWithinTheHTML(html, "</a> &gt; <span class=h2>", "</span></a>"),
        "name": functionData.name,
        "description": getWithinTheHTML(html, "<div class=minh><p class=max2>", "</div>"),
        "returnType": functionData.returnType,
        "parameters": functionData.args,
        "tests": parseFunctionTests(html)
    }
}




async function scrape(url) {

    console.log("Starting Scrape")
    console.log("Scraping: " + url)

    //let categoryname = url.split("/")[url.split("/").length - 1]

    let categoryHtml = await requestPage(url)
    let challengeUrls = parseCatgoryPage(categoryHtml)

    for (let i = 0; i < challengeUrls.length; i++) {
        console.log("Scraping " + challengeUrls[i])
        let pageData = await requestPage(challengeUrls[i])
        let challengeData = parseChallenge(pageData)
        allChals.push(challengeData)
    }
}


let allChals = []
async function main() {

    // Scrape all of Codiong Bat's java challenges
    await scrape("https://codingbat.com/java/Warmup-1")
    await scrape("https://codingbat.com/java/Warmup-2")
    await scrape("https://codingbat.com/java/String-1")
    await scrape("https://codingbat.com/java/Array-1")
    await scrape("https://codingbat.com/java/Logic-1")
    await scrape("https://codingbat.com/java/Logic-2")
    await scrape("https://codingbat.com/java/String-2")
    await scrape("https://codingbat.com/java/String-3")
    await scrape("https://codingbat.com/java/Array-2")
    await scrape("https://codingbat.com/java/Array-3")
    await scrape("https://codingbat.com/java/AP-1")
    await scrape("https://codingbat.com/java/Recursion-1")
    await scrape("https://codingbat.com/java/Recursion-2")
    await scrape("https://codingbat.com/java/Map-1")
    await scrape("https://codingbat.com/java/Map-2")
    await scrape("https://codingbat.com/java/Functional-1")
    await scrape("https://codingbat.com/java/Functional-2")


    fs.writeFileSync("./data/challenges.json", JSON.stringify(allChals))

}

main()