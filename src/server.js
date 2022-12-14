const express = require('express')

const { Server: HttpServer } = require('http')
const { Server: Socket } = require('socket.io')

const ContenedorDB = require('../controllers/ContenedorDB.js')

const {configSQLite3, configMariaDB} = require('./dbConfig.js')


//--------------------------------------------
// instancio servidor, socket y api

const app = express()
const httpServer = new HttpServer(app)
const io = new Socket(httpServer)

//Instancio el contenedor con los manejadores CRUD con Knex, le paso la config de la db y el nombre de la tabla
const productosApi = new ContenedorDB(configMariaDB.options, 'productos')
const mensajesApi = new ContenedorDB(configSQLite3.options, 'mensajes')

//--------------------------------------------
// configuro el socket

io.on('connection', async socket => {
    console.log('Nuevo cliente conectado!');

    // carga inicial de productos
    socket.emit('productos', await productosApi.listarAll());

    // actualizacion de productos
    socket.on('update', async producto => {
        await productosApi.guardar(producto)
        io.sockets.emit('productos', await productosApi.listarAll());
    })

    // carga inicial de mensajes
    socket.emit('mensajes', await mensajesApi.listarAll());

    // actualizacion de mensajes
    socket.on('nuevoMensaje', async mensaje => {
        mensaje.fyh = new Date().toLocaleString()
        await mensajesApi.guardar(mensaje)
        io.sockets.emit('mensajes', await mensajesApi.listarAll());
    })
});

//--------------------------------------------
// agrego middlewares

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))

//--------------------------------------------
// inicio el servidor

const PORT = process.env.PORT || 8080
const connectedServer = httpServer.listen(PORT, () => {
    console.log(`Servidor http escuchando en el puerto ${connectedServer.address().port}`)
})
connectedServer.on('error', error => console.log(`Error en servidor ${error}`))
