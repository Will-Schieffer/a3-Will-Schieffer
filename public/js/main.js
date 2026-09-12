// FRONT-END (CLIENT) JAVASCRIPT HERE
const form = document.querySelector( '#recipeForm' )
const list = document.querySelector( '#recipeList' )
const submitButton = document.querySelector( '#submit' )

let editingID = null

const submit = async function( event ) {
  // stop form submission from trying to load
  // a new .html page for displaying results...
  // this was the original browser behavior and still
  // remains to this day
  event.preventDefault()

  const titleInput = document.querySelector( '#title' )
  const urlInput = document.querySelector( '#url' )
  const categoryInput = document.querySelector( '#category' )

  const recipe = {
    title: titleInput.value,
    url: urlInput.value,
    category: categoryInput.value
  }

  let response

  if (editingID !== null) {
    recipe.id = editingID

    response = await fetch( '/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify( recipe )
    })

  } else {
    response = await fetch( '/submit', {
      method:'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify( recipe )
    })
  }

  /* Helps to handle failed fetch requests */
  if (!response.ok) {
    const error = await response.json()
    alert(error.error || 'Something went wrong.')
    return
  }

  const recipes = await response.json()

  editingID = null
  submitButton.textContent = 'Save'
  form.reset()

  renderRecipes( recipes )
}

const renderRecipes = function( recipes ) {
  const list = document.querySelector( '#recipeList' )

  list.innerHTML = ''

  recipes.forEach( function( recipe ) {
    const li = document.createElement( 'li' )

    const a = document.createElement( 'a' )
    a.href = recipe.url
    a.target = '_blank'
    a.textContent = recipe.title

    const category = document.createElement( 'span' )
    category.textContent = recipe.category

    const info = document.createElement( 'small' )
    info.textContent = recipe.domain

    const deleteButton = document.createElement( 'button' )
    deleteButton.textContent = 'Delete'
    deleteButton.style.color = 'red'
    deleteButton.onclick = async function() {
      deleteRecipe( recipe.id )
    }

    const editButton = document.createElement( 'button' )
    editButton.textContent = 'Edit'
    editButton.style.color = 'blue'
    editButton.onclick = async function() {
      editRecipe( recipe )
    }

    li.appendChild( a )
    li.appendChild( category )
    li.appendChild( info )
    li.appendChild( deleteButton )
    li.appendChild( editButton )
    list.appendChild( li )
  })
}

const deleteRecipe = async function( id ) {
  const response = await fetch( '/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify( { id } )
  })

  const recipes = await response.json()
  renderRecipes( recipes )
}

const loadRecipes = async function() {
  const response = await fetch( '/recipes' )
  const recipes = await response.json()
  renderRecipes( recipes )
}

window.onload = async function() {
  form.addEventListener('submit', submit)

  await loadRecipes()
}

const editRecipe = function( recipe ) {
  document.querySelector( '#title' ).value = recipe.title
  document.querySelector( '#url' ).value = recipe.url
  document.querySelector( '#category' ).value = recipe.category

  submitButton.textContent = 'Update Recipe'

  editingID = recipe.id
}