const express = require("express");
const fs = require("fs");
const md5 = require('md5');
    
const app = express();
const jsonParser = express.json();
const port = 3030;


  
const filePathUsers = "src/users.json";
const filePathHash = "src/hash.json";


// получить пользователей
app.get("/api/users", (req: string, res: any) => {
    const content = fs.readFileSync(filePathUsers,"utf8");
    const users = JSON.parse(content);
    res.send(users);
});

// добавить пользователя
app.post("/api/users", jsonParser, (req: any, res: any) => {
    if(!req.body) return res.sendStatus(400);      
    const userName = req.body.name;
    le t userPermission = req.body.permission;
    if(userPermission != 'admin')
        userPermission = 'user';

    let user = {name: userName, permission: userPermission};
      
    let data = fs.readFileSync(filePathUsers, "utf8");
    let users = JSON.parse(data);
      
    // находим максимальный id
    const id:any = Math.max.apply(Math,users.map(function(o: any) {return o.id;}))
    // увеличиваем его на единицу
    user.id = id+1;
    // добавляем пользователя в массив
    users.push(user);
    data = JSON.stringify(users);
    // перезаписываем файл с новыми данными
    fs.writeFileSync(filePathUsers, data);
    res.send(user);
});


// изменение пользователя
app.put("/api/users", jsonParser, (req: any, res: any) => {
       
    if(!req.body) return res.sendStatus(400);
      
    const userId = req.body.id;
    const userName = req.body.name;
    const userPermission = req.body.permission;
      
    let data = fs.readFileSync(filePathUsers, "utf8");
    const users = JSON.parse(data);
    let user;
    for(var i=0; i<users.length; i++){
        if(users[i].id==userId){
            user = users[i];
            break;
        }
    }
    // изменяем данные у пользователя
    if(user){
        user.name = userName;
        user.permission = userPermission;
        data = JSON.stringify(users);
        fs.writeFileSync(filePathUsers, data);
        res.send(user);
    }
    else{
        res.status(404).send(user);
    }
});


// удаление пользователя по id
app.delete("/api/users/:id", (req: any, res: any) => {
    
    let data = fs.readFileSync(filePathUsers, "utf8");
    let users = JSON.parse(data);
    let userAdmin;


    // Проверяем права
    const authorizationArr = req.headers.authorization.split(' ');
    if(authorizationArr[0] == 'Bearer'){
        const tokenArr = authorizationArr[1].split('-');
        const userName = tokenArr[0];
        const tokenHash = tokenArr[1];

        // Ищем токен
        let dataTokens = fs.readFileSync(filePathHash, "utf8");
        let tokens = JSON.parse(dataTokens);
    
        let token;
        for (var i=0; i < tokens.length; i++) {
            if (tokens[i].hash == tokenHash){
                token = tokens[i];
                break;
            }
        }
        if(!token)
            res.status(402).send();

        // Ищем юзера
        for(var i=0; i<users.length; i++){
            if(users[i].id==token.user_id && users[i].permission == 'admin'){
                userAdmin = users[i];
                break;
            }
        }
    }
    else{
        res.status(403).send();
    }


    if(!userAdmin)
        res.status(401).send();


    const id = req.params.id;
    
    let index = -1;
    // находим индекс пользователя в массиве
    for (var i=0; i < users.length; i++) {
        if (users[i].id==id){
            index=i;
            break;
        }
    }
    if(index > -1){
        // удаляем пользователя из массива по индексу
        const user = users.splice(index, 1)[0];
        data = JSON.stringify(users);
        fs.writeFileSync(filePathUsers, data);
        // отправляем удаленного пользователя
        res.send(user);
    }
    else{
        res.status(404).send();
    }
});



// получить список токенов учетной записи
app.get("/api/tokens/:id", (req: any, res: any) => {
    const id = req.params.id;
    if(!id) return res.sendStatus(400);

    let dataUsers = fs.readFileSync(filePathUsers, "utf8");
    let users = JSON.parse(dataUsers);
    let user;
    for(var i=0; i<users.length; i++){
        if(users[i].id==id){
            user = users[i];
            break;
        }
    }
    if(!user) return res.sendStatus(400);

    let dataPTokens = fs.readFileSync(filePathHash, "utf8");
    let dataTokens = JSON.parse(dataPTokens);
    let tokens = [];
    for(var i=0; i<dataTokens.length; i++){
        if(dataTokens[i].user_id == user.id){
            tokens.push(user.name + "-" + dataTokens[i].hash);
        }
    }
    res.send(tokens);
});

// получить список всех токенов
app.get("/api/tokens", (req: any, res: any) => {

    let dataUsers = fs.readFileSync(filePathUsers, "utf8");
    let usersArr = JSON.parse(dataUsers);
    let users = [];
    for(var i=0; i<usersArr.length; i++){
        users[usersArr[i].id] = usersArr[i];
    }
    if(!users) return res.sendStatus(400);

    let dataPTokens = fs.readFileSync(filePathHash, "utf8");
    let dataTokens = JSON.parse(dataPTokens);
    let tokens = [];
    for(var i=0; i<dataTokens.length; i++){
        let user = users[dataTokens[i].user_id];
        if(user){
            tokens.push(user.name + "-" + dataTokens[i].hash);
        }
    }
    res.send(tokens);
});


// добавить токен
app.post("/api/tokens", jsonParser, (req: any, res: any) => {
    if(!req.body) return res.sendStatus(400);      
    const userID = req.body.id;
    let dataUsers = fs.readFileSync(filePathUsers, "utf8");
    let users = JSON.parse(dataUsers);
    let user;
    for(var i=0; i<users.length; i++){
        if(users[i].id==userID){
            user = users[i];
            break;
        }
    }
    if(!user) return res.sendStatus(400);

    let token = {user_id: user.id, hash: md5(Date.now())};

    let dataTokens = fs.readFileSync(filePathHash, "utf8");
    let tokens = JSON.parse(dataTokens);

    tokens.push(token);
    dataTokens = JSON.stringify(tokens);
    fs.writeFileSync(filePathHash, dataTokens);
    
    let token_res = user.name + "-" + token.hash;
    
    res.send(token_res);
});



// изменить токен
app.put("/api/tokens", jsonParser, (req: any, res: any) => {
    if(!req.body) return res.sendStatus(400);      
    const tokenVal = req.body.token;
    const tokenArr = tokenVal.split('-');
    const tokenUser = tokenArr[0];
    const tokenHash = tokenArr[1];

    let dataTokens = fs.readFileSync(filePathHash, "utf8");
    let tokens = JSON.parse(dataTokens);
    let token;
    for(var i=0; i<tokens.length; i++){
        if(tokens[i].hash==tokenHash){
            token = tokens[i];
            break;
        }
    }
    if(!token) res.status(403);

    token.hash = md5(Date.now());
    dataTokens = JSON.stringify(tokens);
    fs.writeFileSync(filePathHash, dataTokens);
    let token_res = tokenUser + "-" + token.hash;
    res.send(token_res);
});


// удаление токена
app.delete("/api/tokens/:token", (req: any, res: any) => {
    const tokenVal = req.params.token;
    const tokenArr = tokenVal.split('-');
    const tokenUser = tokenArr[0];
    const tokenHash = tokenArr[1];

    let dataTokens = fs.readFileSync(filePathHash, "utf8");
    let tokens = JSON.parse(dataTokens);

    let index = -1;
    for (var i=0; i < tokens.length; i++) {
        if (tokens[i].hash == tokenHash){
            index=i;
            break;
        }
    }
    if(index > -1){
        // удаляем из массива по индексу
        const tokens = tokens.splice(index, 1)[0];
        dataTokens = JSON.stringify(tokens);
        fs.writeFileSync(filePathTokens, dataTokens);

        let token_res = tokenUser + "-" + tokenHash;
        res.send(token_res);
    }
    else{
        res.status(404).send();
    }
});



app.listen(port, function(){
    console.log("Сервер ожидает подключения...");
});
