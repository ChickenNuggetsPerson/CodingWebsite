document.getElementById('execute-button').addEventListener('click', async () => {
    const javaCode = document.getElementById('code-input').value;

    // Send a POST request to the server to execute Java code
    const response = await fetch('/execute', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ javaCode })
    });

    const result = await response.text();
    console.log(result)
    processResults(result)

});

function processResults(result) {
    document.getElementById('result-display').textContent = result;

    let index = 0;
    let lines = result.split("\n")
    lines.forEach((line) => {
        let args = line.split(" ")
        if (args[0] == "-") {
            document.getElementById(`row${index}`).classList.remove("goodRedult")
            document.getElementById(`row${index}`).classList.remove("badResult")
            if ((challenge.tests[index].returns == args[2])) {
                document.getElementById(`row${index}`).classList.add("goodRedult")
            } else {
                document.getElementById(`row${index}`).classList.add("badResult")
            } 

        }
        index++;
    })
}

console.log(challenge)
console.log(userID)

document.getElementById("challengeTitle").innerText = "Daily Challenge: " + challenge.title;
document.getElementById("challengeDesc").innerText = challenge.description

let argsString = ""
for (let i = 0; i < challenge.parameters.length; i++) {
    argsString += `${challenge.parameters[i].type} ${challenge.parameters[i].name}`
    if (i + 1 != challenge.parameters.length) {
        argsString += ", "
    }
}

document.getElementById("functionDecloration").innerText = `public ${challenge.returnType} ${challenge.name}(${argsString}) {`
document.getElementById("functionEnd").innerText = "};"


let grid = document.getElementById("testGrid")
let count = 0;
challenge.tests.forEach(test => {
    let args = "";
    for (let i = 0; i < test.args.length; i++) {
        args += test.args[i]
        if (i + 1 != test.args.length) {
            args += ", "
        }
    }

    let row = document.createElement("div")
    row.classList.add("row")

    let testCol = document.createElement("div")
    testCol.classList.add("col")
    testCol.id = `row${count}`
    let testColTxt = document.createElement("h6")
    testColTxt.innerText = `${challenge.name}(${args}) -> ${test.returns}`
    testCol.appendChild(testColTxt)
    row.appendChild(testCol)

    grid.appendChild(row)
    count++;
});



document.getElementById('code-input').addEventListener('keydown', function(e) {
    if (e.key == 'Tab') {
      e.preventDefault();
      var start = this.selectionStart;
      var end = this.selectionEnd;
  
      // set textarea value to: text before caret + tab + text after caret
      this.value = this.value.substring(0, start) +
        "\t" + this.value.substring(end);
  
      // put caret at right position again
      this.selectionStart =
        this.selectionEnd = start + 1;
    }
});