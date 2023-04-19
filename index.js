///////////////////////////////////
// LOADING REQUIRED DEPENDENCIES //
///////////////////////////////////
const fs = require("fs/promises");  // file system with Promises
const express = require("express"); // express web server
const cors = require("cors");       // cross origin resource sharing
const https = require("https");     // https used to GET initial data from the URL


const app = express();   // setting up the API server
app.use(express.json()); // allowing express to support JSON (uses some built-in middleware)


// initially get the data from the URL to store on our data directory as 'users.json'
https.get('https://dummyjson.com/users', (response) => {
    let data = '';

    // chunk of data has been received 
    response.on('data', (chunk) => {
        data += chunk;
    });

    // whole response has been received
    response.on('end', async () => {
        // save the data to file
        await fs.mkdir("data", { recursive: true }); // making new directory if does not exist
        await fs.writeFile(`data/users.json`, data); // writing the json file with received data
        console.log("JSON data from URL has been received and saved.");
    });
})
.on('error', (err) => {
    console.log(`Error: ${err.message}`);
});


// defining a GET endpoint for '/users', will return JSON list of all users inside 'users.json'
app.get("/users", (req, res) => {
    console.log("GET request has been received.");

    // read the users.json file
    fs.readFile("./data/users.json")
        .then((data) => {
            let jsonObj = JSON.parse(data);
            console.log("Sending back:\n" + JSON.stringify(jsonObj["users"]));
            return res.json(jsonObj["users"]);
        })
        .catch((error) => {
            console.log(`Error: ${error}`);
            return res.sendStatus(400);
        });
});


// defining a GET endpoint for '/users/id', will return JSON object of the selected user
app.get("/users/:id", (req, res) => {
    // get the passed in id
    const id = req.params.id; 
    console.log(`GET request with id: ${id} has been received.`);

    // read the users.json file
    fs.readFile("./data/users.json")
        .then((data) => {
            let jsonObj = JSON.parse(data);

            // loop through the list of users
            for (let i = 0; i < jsonObj["users"].length; i++) {
                if (jsonObj["users"][i]["id"] == id) {
                    console.log("Sending back:\n" + JSON.stringify(jsonObj["users"][i]));
                    return res.json(jsonObj["users"][i]);
                }
            }

            // if id was not found
            console.log(`The id: ${id} was not found.`);
            return res.sendStatus(400);
        })
        .catch((error) => {
            console.log(`Error: ${error}`);
            return res.sendStatus(400);
        });

});



// defining a POST endpoint for '/users', will return the id of the newly added user object
app.post("/users", async (req, res) => {
    // get the passed in body data
    const body = req.body; 
    console.log("POST request has been received with body:\n" + JSON.stringify(body));

    // making sure that the user provides json content in the body
    if (!body) {
        console.log("Body did not include any data.");
        return res.sendStatus(400); // 400 = bad request
    }

    // read the users.json file
    fs.readFile("./data/users.json")
        .then(async (data) => {
            let jsonObj = JSON.parse(data);

            // create the next id in line
            let nextId = (jsonObj["users"][jsonObj["users"].length - 1]["id"]) + 1;

            // set new id to body, regardless if it has one already or not
            body["id"] = nextId; 

            // push new body JSON object to the jsonObj users list
            jsonObj["users"].push(body); 

            // save the new data to file
            await fs.writeFile(`data/users.json`, JSON.stringify(jsonObj));
            console.log("Saved body JSON object into users.json file.");

            // returning the id of body
            console.log(`Body id: ${body["id"]}`);
            return res.json(body["id"]);
        })
        .catch((error) => {
            console.log(`Error: ${error}`);
            return res.sendStatus(400);
        });
});


// defining a PUT endpoint for '/users/id', will return updated list of users
app.put("/users/:id", (req, res) => {
    // get the passed in id
    const id = req.params.id; 
    // get the passed in body data
    const body = req.body; 
    console.log(`PUT request has been received with id: ${id} and with body:\n` + JSON.stringify(body));

    // read the users.json file
    fs.readFile("./data/users.json")
        .then(async (data) => {
            let jsonObj = JSON.parse(data);
            let modified = false;

            // loop through the list of users
            for (let i = 0; i < jsonObj["users"].length; i++) {
                if (jsonObj["users"][i]["id"] == id) {
                    // preserve initial id
                    let initialId = jsonObj["users"][i]["id"];
                    // replace object
                    jsonObj["users"][i] = body;
                    // give back the initial id
                    jsonObj["users"][i]["id"] = initialId;
                    modified = true;
                }
            }

            if (modified) {
                // save the new data to file
                await fs.writeFile(`data/users.json`, JSON.stringify(jsonObj));
                console.log("PUT successful & rewrote the users.json file.");
                return res.json(jsonObj["users"]);
            }
            else {
                // id was not found
                console.log(`The id: ${id} was not found.`);
                return res.sendStatus(400);
            }
        })
        .catch((error) => {
            console.log(`Error: ${error}`);
            return res.sendStatus(400);
        });

});


// defining a new DELETE endpoint, will return updated list of users
app.delete("/users/:id", (req, res) => {
    // get the passed in id
    const id = req.params.id;
    console.log(`DELETE request with id: ${id} has been received.`);

    // read the users.json file
    fs.readFile("./data/users.json")
        .then(async (data) => {
            let jsonObj = JSON.parse(data);
            let removed = false;

            // loop through the list of users
            for (let i = 0; i < jsonObj["users"].length; i++) {
                if (jsonObj["users"][i]["id"] == id) {
                    // remove the user object from the users array
                    jsonObj["users"].splice(i, 1);
                    removed = true;
                }
            }

            if (removed) {
                // save the new data to file
                await fs.writeFile(`data/users.json`, JSON.stringify(jsonObj));
                console.log("DELETE successful & rewrote the users.json file.");
                return res.json(jsonObj["users"]);
            }
            else {
                // id was not found
                console.log(`The id: ${id} was not found.`);
                return res.sendStatus(400);
            }
        })
        .catch((error) => {
            console.log(`Error: ${error}`);
            return res.sendStatus(400);
        });
});


// API server listening on: http://localhost:3000
app.listen(3000, () => console.log("API Server is running..."));