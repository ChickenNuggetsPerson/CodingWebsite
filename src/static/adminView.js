/*
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

*/

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
console.log(otherChallenges)

try {
    document.getElementById("challengeTitle").value = challenge.title;
    document.getElementById("challengeDesc").innerText = challenge.description

    let argsString = ""
    for (let i = 0; i < challenge.parameters.length; i++) {
        argsString += `${challenge.parameters[i].type} ${challenge.parameters[i].name}`
        if (i + 1 != challenge.parameters.length) {
            argsString += ", "
        }
    }

    switch (challenge.returnType) {
        case "void":
            document.getElementById("returnTypeSelect").value = 0;
            break;
        case "boolean":
            document.getElementById("returnTypeSelect").value = 1;
            break;
        case "int":
            document.getElementById("returnTypeSelect").value = 2;
            break;
        case "double":
            document.getElementById("returnTypeSelect").value = 3;
            break;
    }

    document.getElementById("functionName").value = challenge.name

    document.getElementById("testsJson").value = js_beautify(JSON.stringify(challenge.tests))

    //document.getElementById("functionEnd").innerText = "};"
} catch (err) {
    document.getElementById("testsJson").value = js_beautify(JSON.stringify([
        {
            "args": ["false"],
            "returns": "true"
        }
    ]))
}

//document.getElementById("functionDecloration").innerText = `(`
//document.getElementById("code-input").value = `// Enter some test code here`

let dropdown = document.getElementById("challengeDropdown")
otherChallenges.forEach(otherChallenge => {
    let li = document.createElement("li")
    let a = document.createElement("a")
    a.classList.add("dropdown-item")
    a.href = "/admin/view/" + otherChallenge.id
    a.innerText = otherChallenge.title

    li.appendChild(a)
    dropdown.appendChild(li)

})

document.getElementById("newChallengeButton").setAttribute("href", "/admin/view/" + crypto.randomUUID())



async function save() {
    return new Promise(async (resolve) => {
        console.log("Saving")

        const response = await fetch('/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(buildChallengeObj())
        });

        const rewResult = await response.text();
        console.log(rewResult)
        if (rewResult == "OK") {
            $.notify("Saved", "success");
            resolve(true)
        } else {
            $.notify("Could Not Save", "error");
            resolve(false)
        }
        
        
    })
}
async function setCurrent() {

    const response = await fetch('/setCurrent', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({uuid: window.location.pathname.split("/")[window.location.pathname.split("/").length - 1]})
    });

    const rewResult = await response.text();
    console.log(rewResult)
    if (rewResult == "OK") {
        $.notify("Set as Current Challenge", "success");
    } else {
        $.notify("Could Not Set Current", "error");
    }
}
async function deleteChallenge() {
    bootbox.dialog({
        size: 'medium',
        //inputType: "text",
        message: `Are you sure you want to delete this challenge?`,
        title: "Delete Challenge",
        //value: data,
        buttons: {
            cancel: {
              label: "No, I didn't mean to press that button",
              className: "btn-success",
              callback: function(result) {}
            },
            confirm: {
              label: "Yes, Destroy It",
              className: "btn-danger",
              callback: async function(result) {
                const response = await fetch('/deleteChallenge', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({uuid: window.location.pathname.split("/")[window.location.pathname.split("/").length - 1]})
                });
            
                const rewResult = await response.text();
                console.log(rewResult)
                if (rewResult == "OK") {
                    setTimeout(() => {
                        changePage("/admin/view") 
                    }, 200);
                } else {
                    $.notify("Error in Deleting Challenge", "error");
                }
              }
            }
        },
        callback: function(result) {}
    })
}



// Build Arg System
let argTypes = [
    //"void",
    "boolean",
    "int",
    "double"
]
try {
    challenge.parameters.forEach(parm => {
        console.log(parm)

        let tmp = document.createElement("li")

        let card = document.createElement('div')
        card.classList.add("card")

        let cardBody = document.createElement("div")
        cardBody.classList.add("card-body")
        cardBody.classList.add("input-group")
        
        let argTitle = document.createElement("span")
        argTitle.classList.add("input-group-text")
        argTitle.innerText = parm.type

        let input = document.createElement("input")
        input.setAttribute("type", "text")
        input.classList.add("form-control")
        input.value = parm.name

        cardBody.appendChild(argTitle)
        cardBody.appendChild(input)
        card.appendChild(cardBody)
        tmp.appendChild(card)
        tmp.setAttribute("retType", parm.type)
        document.getElementById("argList").appendChild(tmp)
    })
} catch (err) {}

new Sortable(document.getElementById("sideBarArgList"), {
    group: {
        name: 'shared',
        pull: 'clone',
        put: true // Do not allow items to be put into this list
    },
    animation: 150,
    sort: false, // To disable sorting: set sort to false
    onSort: function(event) {
        if (event.from.id != "sideBarArgList") {
            event.item.remove()
        } else {
            let input = document.createElement("input")
            input.setAttribute("type", "text")
            input.classList.add("form-control")

            event.item.firstChild.firstChild.appendChild(input)
            console.log(event.item)
        }
    }
});
argTypes.forEach(arg => {
    let tmp = document.createElement("li")

    let card = document.createElement('div')
    card.classList.add("card")

    let cardBody = document.createElement("div")
    cardBody.classList.add("card-body")
    cardBody.classList.add("input-group")
    
    let argTitle = document.createElement("span")
    argTitle.classList.add("input-group-text")
    argTitle.innerText = arg

    cardBody.appendChild(argTitle)
    card.appendChild(cardBody)
    tmp.appendChild(card)
    tmp.setAttribute("retType", arg)
    document.getElementById("sideBarArgList").appendChild(tmp)
})

let buildingList = new Sortable(document.getElementById("argList"), {
    group: 'shared',
    animation: 150,
    
});




function buildChallengeObj() {

    let returnType = ""
    switch (document.getElementById("returnTypeSelect").value) {
        case "0":
            returnType = "void"
            break;
        case "1":
            returnType = "boolean"
            break;
        case "2":
            returnType = "int"
            break;
        case "3":
            returnType = "double"
            break;
    }
    let parms = []
    document.getElementById("argList").querySelectorAll("li").forEach(item => {
        parms.push({
            name: item.firstChild.firstChild.lastChild.value,
            type: item.getAttribute("retType")
        })
    })
    let obj = {
        "id": window.location.pathname.split("/")[window.location.pathname.split("/").length - 1],
        "public": true,
        "title": document.getElementById("challengeTitle").value,
        "name": document.getElementById("functionName").value,
        "description": document.getElementById("challengeDesc").value,
        "returnType": returnType,
        "parameters": parms,
        "tests": JSON.parse(document.getElementById("testsJson").value)
    }
    return obj
}

