require('dotenv').config()

const express = require( 'express' ),
      { MongoClient } = require( 'mongodb' ),
      dir  = 'public/',
      port = 3000

const uri = process.env.MONGODB_URI
const client = new MongoClient( uri )

// gets set to the MongoDB collection once we've connected, in start() at the bottom
let recipes

/* ignoring this */
const appdata = [
  { 'model': 'toyota', 'year': 1999, 'mpg': 23 },
  { 'model': 'honda', 'year': 2004, 'mpg': 30 },
  { 'model': 'ford', 'year': 1987, 'mpg': 14} 
]

const app = express()

// yay my old routes are dead
app.use( express.static( dir ) )

app.get( '/recipes', sendRecipes )
app.post( '/submit', handlePost )
app.post( '/delete', handleDelete )
app.post( '/update', handleUpdate )

async function handlePost( request, response ) {
  let dataString = ''

  request.on( 'data', function( data ) {
    dataString += data
  })

  request.on( 'end', async function() {

    let recipe

    try {
      recipe = JSON.parse(dataString)
    } catch (err) {
      response.writeHead(400, { 'Content-Type': 'application/json' })
      response.end(JSON.stringify({ error: 'Invalid JSON' }))
      return
    }

    let url

    /* Validate URL after testing feedback */
    try {
      url = new URL(recipe.url)

      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new Error('Invalid protocol')
      }

      if (!url.hostname) {
        throw new Error('Missing hostname')
      }

    } catch (err) {
      response.writeHead(400, { 'Content-Type': 'application/json' })
      response.end(JSON.stringify({ error: 'Invalid URL' }))
      return
    }

    recipe.domain = url.hostname.replace(/^www\./, '')
    recipe.id = Date.now() // This is a little scuffed but it should work

    await recipes.insertOne( recipe )
    const allRecipes = await recipes.find({}).toArray()

    response.writeHead( 200, "OK", {'Content-Type': 'application/json' })

    // change this to incorporate data - ok
    response.end(JSON.stringify(allRecipes))
  })
}

async function handleDelete( request, response ) {
  let dataString = ''

  request.on( 'data', function( data ) {
    dataString += data
  })

  request.on( 'end', async function() {

    let payload

    try {
      payload = JSON.parse(dataString)
    } catch (err) {
      response.writeHead(400, { 'Content-Type': 'application/json' })
      response.end(JSON.stringify({ error: 'Invalid JSON' }))
      return
    }

    const id = payload.id

    await recipes.deleteOne( { id: id } )

    const allRecipes = await recipes.find({}).toArray()

    response.writeHead(200, { 'Content-Type': 'application/json' })
    response.end(JSON.stringify(allRecipes))
  })
}

async function handleUpdate( request, response ) {
  let dataString = ''

  request.on( 'data', function( data ) {
    dataString += data
  })

  request.on( 'end', async function() {

    let incoming

    try {
      incoming = JSON.parse(dataString)
    } catch (err) {
      response.writeHead(400, { 'Content-Type': 'application/json' })
      response.end(JSON.stringify({ error: 'Invalid JSON' }))
      return
    }

    await recipes.updateOne( { id: incoming.id }, { $set: incoming }, { upsert: true } )

    const allRecipes = await recipes.find({}).toArray()

    response.writeHead(200, { 'Content-Type': 'application/json' })
    response.end(JSON.stringify(allRecipes))
  })
}

async function sendRecipes( request, response ) {
  const allRecipes = await recipes.find({}).toArray()

  response.writeHead( 200, "OK", {'Content-Type': 'application/json' })
  response.end(JSON.stringify(allRecipes))
}

// catches anything that didn't match a route above or a static file
app.use( function( request, response ) {
  response.writeHead(404, { 'Content-Type': 'text/plain' })
  response.end('404 Error: Not Found')
})

async function start() {
  await client.connect()
  recipes = client.db().collection( 'recipes' )

  // debug message
  console.log('Connected, listening on port ' + port)

  app.listen( process.env.PORT || port )
}

start()
