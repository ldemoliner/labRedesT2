//HOW TO START
//node app.js <config.txt> <mensagem> <seu endereço>
//node app.js <withToken.txt> <messages2.txt> <127.0.0.1:6000>

//TO DO
/*
-DEIXAR O USUARIO ESCREVER SUA MENSAGEM E PARA QUEM DESEJA ENVIAR A MENSAGEM
-MUDAR CONTROLE DE ERRO
*/

//IMPORTS
var dgram = require('dgram');
var fs = require('fs');
//CREATING SERVER
var server = dgram.createSocket('udp4');

//READ CONFIG
var content = fs.readFileSync(process.argv[2], 'utf8');
//SPLITS
content = content.split("\r\n");
content[0] = content[0].split(":");
content[0][1] = parseInt(content[0][1]);
var DESTINATION_PORT = content[0][1];
var DESTINATION_HOST = content[0][0];
var NAME = content[1];
var TIME = content[2]*1000;
var TOKEN = content[3];
var ADRESS = process.argv[4].split(":");
ADRESS[1] = parseInt(ADRESS[1]);

//READ MESSAGES IN QUEUE
var queue = fs.readFileSync(process.argv[3], 'utf8');
//SPLITS 
queue = queue.split("\r\n");
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
        //IF SHOULD WRITE
        if(shouldWrite() && queue.length > 0){
            var tuple = queue.pop();
            var package = `2345;naocopiado:${NAME}:${tuple[1]}:${tuple[2]}:${tuple[0]}`
            setTimeout(() => {server.send(package, 0, package.length, DESTINATION_PORT, DESTINATION_HOST, (err, bytes) => {})}, TIME);
        } else {
            setTimeout(() => {server.send(message, 0, message.length, DESTINATION_PORT, DESTINATION_HOST, (err, bytes) => {});}, TIME);
        }
        //IF I SEND MESSAGE
    } else if(itsMe(message)){
        console.log("Mensagem retornou com sucesso!")
        var token = Buffer("1234");
        setTimeout(() => {server.send(token, 0, token.length, DESTINATION_PORT, DESTINATION_HOST, (err, bytes) => {})}, TIME);
        //IF MESSAGE IS FOR ME
    } else if(forMe(message)) {
        console.log("Mensagem recebida!");
        message = message + ""
        var origin = message.split(":")[1];
        var from = message.split(":")[2];
        var mail = message.split(":")[4];
        console.log("\nDe:" + origin + "\nPara:"+ from + "\nMensagem:" + mail);
        if(from === NAME){
            var token = Buffer("1234");
            setTimeout(() => {server.send(token, 0, token.length, DESTINATION_PORT, DESTINATION_HOST, (err, bytes) => {})}, TIME);
        }else{
            setTimeout(() => {server.send(message, 0, message.length, DESTINATION_PORT, DESTINATION_HOST, (err, bytes) => {})}, TIME);
        }
    } else {
        console.log("Repassando a mensagem");
        setTimeout(() => {server.send(message, 0, message.length, DESTINATION_PORT, DESTINATION_HOST, (err, bytes) => {})}, TIME);
    }
});

server.bind(ADRESS[1], ADRESS[0]);

//VERIFY TOKEN
if(TOKEN === "true"){
    message = Buffer("1234");
    server.send(message, 0, message.length, DESTINATION_PORT, DESTINATION_HOST, (err, bytes) => {});
}

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