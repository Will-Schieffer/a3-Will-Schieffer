const http = require( 'http' ),
      fs   = require( 'fs' ),
      // IMPORTANT: you must run `npm install` in the directory for this assignment
      // to install the mime library if you're testing this on your local machine.
      // On Render, make sure `npm install` is your build command.
      mime = require( 'mime' ),
      dir  = 'public/',
      port = 3000

const recipes = []

/* ignoring this */
const appdata = [
  { 'model': 'toyota', 'year': 1999, 'mpg': 23 },
  { 'model': 'honda', 'year': 2004, 'mpg': 30 },
  { 'model': 'ford', 'year': 1987, 'mpg': 14} 
]


// I don't love this way of handling routes but it works for my purposes I guess
const server = http.createServer( function( request,response ) {
  if( request.method === 'GET' && request.url === '/recipes' ) {
    sendRecipes( response )
  }else if( request.method === 'GET') {
    handleGet( request, response )    
  }else if( request.method === 'POST' && request.url == '/submit' ) {
    handlePost( request, response ) 
  }else if (request.method === 'POST' && request.url == '/delete') {
    handleDelete( request, response )
  }else if (request.method === 'POST' && request.url == '/update') {
    handleUpdate( request, response )
  }else {
    response.writeHead(404, { 'Content-Type': 'text/plain' })
    response.end('404 Error: Not Found')
  }
})

const handleGet = function( request, response ) {
  const filename = dir + request.url.slice( 1 ) 

  if( request.url === '/' ) {
    sendFile( response, 'public/index.html' )
  }else{
    sendFile( response, filename )
  }
}

const handlePost = function( request, response ) {
  let dataString = ''

  request.on( 'data', function( data ) {
    dataString += data
  })

  request.on( 'end', function() {

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

    recipes.push( recipe )

    response.writeHead( 200, "OK", {'Content-Type': 'application/json' })

    // change this to incorporate data - ok
    response.end(JSON.stringify(recipes))
  })
}

const sendFile = function( response, filename ) {
   const type = mime.getType( filename ) 

   fs.readFile( filename, function( err, content ) {

     // if the error = null, then we've loaded the file successfully
     if( err === null ) {

       // status code: https://httpstatuses.com
       response.writeHeader( 200, { 'Content-Type': type })
       response.end( content )

     }else{

       // file not found, error code 404
       response.writeHeader( 404 )
       response.end( '404 Error: File Not Found' )

     }
   })
}

const handleDelete = function( request, response ) {
  let dataString = ''

  request.on( 'data', function( data ) {
    dataString += data
  })

  request.on( 'end', function() {

    let payload

    try {
      payload = JSON.parse(dataString)
    } catch (err) {
      response.writeHead(400, { 'Content-Type': 'application/json' })
      response.end(JSON.stringify({ error: 'Invalid JSON' }))
      return
    }

    const id = payload.id

    const index = recipes.findIndex(function (recipe) {
      return recipe.id === id
    })

    if (index >= 0) {
      recipes.splice(index, 1)
    }

    response.writeHead(200, { 'Content-Type': 'application/json' })
    response.end(JSON.stringify(recipes))
  })
}

const handleUpdate = function( request, response ) {
  let dataString = ''

  request.on( 'data', function( data ) {
    dataString += data
  })

  request.on( 'end', function() {
    
    
    let incoming

    try {
      incoming = JSON.parse(dataString)
    } catch (err) {
      response.writeHead(400, { 'Content-Type': 'application/json' })
      response.end(JSON.stringify({ error: 'Invalid JSON' }))
      return
    }
    
    const index = recipes.findIndex(function (recipe) {
      return recipe.id === incoming.id
    })

    if (index >= 0) {
      recipes[index] = incoming
    } else {
      recipes.push(incoming)
    }

    response.writeHead(200, { 'Content-Type': 'application/json' })
    response.end(JSON.stringify(recipes))
  })
}

const sendRecipes = function( response ) {
  response.writeHead( 200, "OK", {'Content-Type': 'application/json' })
  response.end(JSON.stringify(recipes))
}

server.listen( process.env.PORT || port )
