//HOW TO START
//node app.js <config.txt> <mensagem> <seu endereço>
//node app.js <withToken.txt> <messages2.txt> <127.0.0.1:6000>
//node app.js <withoutToken.txt> <messages3.txt> <127.0.0.1:6001>
//node app.js <withoutToken2.txt> <messages.txt> <127.0.0.1:6002>

//TO DO
/*
-DEIXAR O USUARIO ESCREVER SUA MENSAGEM E PARA QUEM DESEJA ENVIAR A MENSAGEM
-AO OCORRER UM ERRO, COLOCAR DE VOLTA NA FILA E PASSAR O TOKEN
*/

//IMPORTS
var dgram = require('dgram');
var fs = require('fs');
//CREATING SERVER
var server = dgram.createSocket('udp4');

//READ CONFIG
var content = fs.readFileSync(process.argv[2], 'utf8');
//SPLITS
//WINDOWS
//content = content.split("\r\n");
//LINUX
content = content.split("\n");
content[0] = content[0].split(":");
content[0][1] = parseInt(content[0][1]);
var DESTINATION_PORT = content[0][1];
var DESTINATION_HOST = content[0][0];
var NAME = content[1];
var TIME = content[2]*1000;
var TOKEN = content[3];
var ERROR_CONTROL = "naocopiado";
var ADRESS = process.argv[4].split(":");
ADRESS[1] = parseInt(ADRESS[1]);

//READ MESSAGES IN QUEUE
var queue = fs.readFileSync(process.argv[3], 'utf8');
//SPLITS 
//WINDOWS
//queue = queue.split("\r\n");
//LINUX
queue = queue.split("\n");
for(let i=0; i<queue.length; i++){
    queue[i] = queue[i].split(":")
}

//SERVER LISTENING
server.on('listening', function () {
    var address = server.address();
    console.log('UDP Server listening on ' + address.address + ":" + address.port);
});

//SERVER SENDING MESSAGES
server.on('message', function (message, remote) {
    console.log(remote.address + ':' + remote.port +' - ' + message);
    //IF HAVE TOKEN
    if(isToken(message)){
        console.log(queue);
        //IF SHOULD WRITE
        if(shouldWrite() && queue.length > 0){
            var top = queue[queue.length-1];
            var tuple = top;
            ERROR_CONTROL = "naocopiado"
            var package = `2345;${ERROR_CONTROL}:${NAME}:${tuple[1]}:${tuple[2]}:${tuple[0]}`
            sendPackage(package);
        } else {
            sendMessage(message);
        }
        //IF I SEND MESSAGE
    } else if(itsMe(message)){
        message = message+""
        var erro = message.split(":")[0].split(";")[1];
        console.log("ERRO AO RETORNAR")
        console.log(erro)
        if(erro === "naocopiado" || erro === "OK"){
            console.log("A mensagem retornou!");
            queue.pop();
            var token = Buffer("1234");
            sendToken(token);
        } else {
            console.log("Ocorreu um erro com a mensaagem, adicionando a fila novamente");
            message = message.replace("erro","naocopiado");
            console.log(queue);
            var token = Buffer("1234");
            sendToken(token);
        }
        //IF MESSAGE IS FOR ME
    } else if(forMe(message)) {
        randomError();
        if(ERROR_CONTROL === "OK"){
            console.log("Mensagem recebida!");
            message = message + "";
            message = message.replace("naocopiado",ERROR_CONTROL);
            var origin = message.split(":")[1];
            var from = message.split(":")[2];
            var mail = message.split(":")[4];
            console.log("\nDe:" + origin + "\nPara:"+ from + "\nMensagem:" + mail);
            if(from === NAME){
                var token = Buffer("1234");
                sendToken(token);
            }else{
                sendMessage(message);
            }
        }else {
            //AJUSTAR ESSE ELSE
            console.log("Ocorreu um erro com a mensagem");
            message = message + "";
            message = message.replace("naocopiado",ERROR_CONTROL) 
            console.log(ERROR_CONTROL)           
            sendMessage(message);
        }
    } else {
        console.log("Repassando a mensagem");
        sendMessage(message);
        console.log(message+"")
    }
});

server.bind(ADRESS[1], ADRESS[0]);

//VERIFY TOKEN
if(TOKEN === "true"){
    message = Buffer("1234");
    sendMessage(message);
}

//METHODS
function isToken(message){
    return message + "" === "1234";
}

function shouldWrite(){
    // return Math.random() < 0.5;
    return true;
}

function itsMe(message){
    message = message + "";
    message = message.split(":");
    return message[1] === NAME;
}

function forMe(message){
    message = message + "";
    message = message.split(":");
    return message[2] === NAME || message[2] === "TODOS";
}

function randomError(){
    if(Math.random() < 0.8){
        return ERROR_CONTROL = "erro"
    }else {
        return ERROR_CONTROL = "OK"
    }
}

function sendMessage(message){
    setTimeout(() => {server.send(message, 0, message.length, DESTINATION_PORT, DESTINATION_HOST, (err, bytes) => {})}, TIME);
}

function sendToken(token){
    setTimeout(() => {server.send(token, 0, token.length, DESTINATION_PORT, DESTINATION_HOST, (err, bytes) => {})}, TIME);
}

function sendPackage(package){
    setTimeout(() => {server.send(package, 0, package.length, DESTINATION_PORT, DESTINATION_HOST, (err, bytes) => {})}, TIME);
}