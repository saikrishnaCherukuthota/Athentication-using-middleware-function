let express = require('express')
let {open} = require('sqlite')
let sqlite3 = require('sqlite3')

let bcrypt = require('bcrypt')

let app = express()
app.use(express.json())

let {join} = require('path')
let address = join(__dirname, 'userData.db')

let db = null
let kk = async function () {
  try {
    db = await open({
      filename: address,
      driver: sqlite3.Database,
    })
  } catch (e) {
    console.log(e)
    process.exit(1)
  }
  app.listen(3000, () => {
    console.log('_______________RUNNING ON PORT 3000_______________')
  })
}
kk()

app.post('/register', async (request, response) => {
  let obj = request.body
  let {username, name, password, gender, location} = obj

  let qu = `select * from user where username="${username}";`
  let user = await db.get(qu)
  if (user === undefined) {
    let len = password.length
    if (len < 5) {
      response.status(400)
      response.send('Password is too short')
    } else {
      let hashedPassword = await bcrypt.hash(password, 10)

      let qu2 = `insert into user(username,name,password,gender,location) values("${username}","${name}","${hashedPassword}","${gender}","${location}");`
      await db.run(qu2)
      response.status(200)
      response.send('User created successfully')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

app.post('/login', async (request, response) => {
  let obj = request.body
  let {username, password} = obj
  let qu = `select * from user where username="${username}";`

  let user = await db.get(qu)

  if (user === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    let isPasswordCorrect = await bcrypt.compare(password, user.password)
    if (isPasswordCorrect) {
      response.status(200)
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

app.put('/change-password', async (request, response) => {
  let obj = request.body

  let {username, oldPassword, newPassword} = obj
  let qu = `select * from user where username="${username}";`
  let user = await db.get(qu)
  let {password} = user
  let isPasswordCorrect = await bcrypt.compare(oldPassword, password)
  if (isPasswordCorrect) {
    if (newPassword.length < 5) {
      response.status(400)
      response.send('Password is too short')
    } else {
      let hashedPassword = await bcrypt.hash(newPassword, 10)
      let qu2 = `update user set password="${hashedPassword}" where username="${username}";`
      await db.run(qu2)
      response.status(200)
      response.send('Password updated')
    }
  } else {
    response.status(400)
    response.send('Invalid current password')
  }
})

module.exports = app
