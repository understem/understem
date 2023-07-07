const cors = require('cors')

const express = require('express');
const request = require('request');
const path = require('path');
const axios = require('axios');
const cookieParser = require('cookie-parser')
const https = require("https")
const fs = require("fs");
const app = express();

app.use(express.static(__dirname + '/dist'));
app.use(cookieParser())
require('dotenv').config()


app.get('/open-questions',  async (req, res) => {
  
  try {
    if (req.cookies.user_school_id != null) {
        let rawdata = fs.readFileSync('./dist/schools/'+req.cookies.user_school_id+'/student_query.json');
        let q = JSON.stringify(JSON.parse(rawdata));
        setCookies(COOKIE_QUESTIONS, res,q)      
        res.json(q)      
        return
      } else {
        throw new Error("Incorrect authorization..")
      }
  } catch(error) {
    let rawdata = fs.readFileSync('./dist/common/error-400.json');
    let err = JSON.parse(rawdata);
    msg = 'Incorrect authorization..'
    err.error.msg = err.error.msg + msg
    res.statusCode=400
    res.sendFile(path.join(__dirname + '../ui//error.html'));  
  } 
})


app.post('/submit-question', async (req, res) => {  

  let isStudent = false
  var userSchoolId = req.cookies.user_school_id
  var studentName

  // Check if the user is an student
  if (req.cookies.mapped_user_name != null && userSchoolId != null) {
    let rawdata = fs.readFileSync('./dist/auth/auth.json')
    let authQ = JSON.parse(rawdata)
    
    for (let i = 0; i < authQ.auth_info.length; i++) {
      if (authQ.auth_info[i].mapped_user_id == req.cookies.mapped_user_name) {
        if (authQ.auth_info[i].user_type == process.env.TYPE_STUDENT &&
            authQ.auth_info[i].college_id == userSchoolId) {
            studentName = authQ.auth_info[i].display_name
            isStudent = true
            break
        }
      }
    } 
  }

  if (isStudent) {
      // Validate the content of the question
      qContent = req.query.question
      aSkill = req.query.skill

      if (qContent.length < 10) {
        let rawdata = fs.readFileSync('./dist/common/error-400.json');
        let err = JSON.parse(rawdata);
        msg = 'Please add more context to your question'
        err.error.msg = err.error.msg + msg
        res.statusCode=400
        res.json(err)
        return
      }  

        // Get the current list of questions
      let rawdata = fs.readFileSync('./dist/schools/'+userSchoolId+'/student_query.json');
      let q = JSON.parse(rawdata);

      // Add a new question
      newQuestion =  {
        id: ""+Math.floor(100000 + Math.random() * 900000),
        submit_time: new Date(new Date().getTime()).toUTCString(),
        isResolved: false,
        question: qContent,
        Skill: aSkill,
        resolved_time: 'NA',
        resolved_by: 'NA',
        StudentName:  studentName
      }
      q.Student_Query.push(newQuestion)
      fs.writeFileSync('./dist/schools/'+userSchoolId+'/student_query.json', JSON.stringify(q));
      res.sendStatus(200)
  } else {
    redirectUrl = "/onboard-school"
    res.redirect(redirectUrl)
  }
});


app.post('/resolve-question', async (req, res) => {  

  let isAlumni = false
  var userSchoolId = req.cookies.user_school_id
  var alumniName

  // Check if the user is an alumni
  if (req.cookies.mapped_user_name != null && userSchoolId != null) {
    let rawdata = fs.readFileSync('./dist/auth/auth.json')
    let authQ = JSON.parse(rawdata)
    
    for (let i = 0; i < authQ.auth_info.length; i++) {
      if (authQ.auth_info[i].mapped_user_id == req.cookies.mapped_user_name) {
        if (authQ.auth_info[i].user_type == process.env.TYPE_ALUMNI &&
          authQ.auth_info[i].college_id == userSchoolId) {
            alumniName = authQ.auth_info[i].display_name
            isAlumni = true
            break
        }
      }
    } 
  }

  if (isAlumni) {
    questionId = req.query.questionId
    
    aSkill = req.query.skill
    if (questionId <= -1 || typeof userSchoolId == process.env.UNDEFINED_VAL || userSchoolId == null) {
        let rawdata = fs.readFileSync('./dist/common/error-400.json');
        let err = JSON.parse(rawdata);
        msg = 'Bad request'
        err.error.msg = err.error.msg + msg
        res.statusCode=400
        res.json(err)
        return
      }
      // Get the current list of questions
      let rawdata = fs.readFileSync('./dist/schools/'+userSchoolId+'/student_query.json');
      let q = JSON.parse(rawdata);
    
      // Find the index of the question to be deleted
      const findQuestionIndex = q.Student_Query.findIndex( (element) => element.id === questionId);
    
      if (findQuestionIndex >= 0) {
        q.Student_Query[findQuestionIndex].isResolved = true
        q.Student_Query[findQuestionIndex].resolved_time = new Date(new Date().getTime()).toUTCString()
        q.Student_Query[findQuestionIndex].resolved_by = alumniName
        fs.writeFileSync('./dist/schools/'+userSchoolId+'/student_query.json', JSON.stringify(q));
      }
      res.sendFile(path.join(__dirname + '../ui/html/alumni-landing.html'));
  }

});

app.get('/alumni-skills', (req, res) => {

  var skills = "{}"

  let rawdata = fs.readFileSync('../dist/common/schools.json');
  let q = JSON.parse(rawdata)
  for (let i = 0; i < q.schools.length; i++) {
    if (q.schools[i].id ==  req.cookies.user_school_id) {
      skills = q.schools[i].skills
      break
    }
  }
  jsonVal = JSON.stringify(skills)
  setCookies(process.env.COOKIE_ALUMNI_SKILLS, res,jsonVal)      
  res.json(jsonVal)
});


app.get('/roles-at-school', (req, res) => {
  let rawdata = fs.readFileSync('./dist/common/role-at-school.json');
  let r = JSON.parse(rawdata);
  res.json(r)    
});

app.get('/schools', (req, res) => {
  let rawdata = fs.readFileSync('../dist/common/schools.json');
  let t = JSON.parse(rawdata);
  res.json(t)    
});


function getDropDowns(url) {
  resp = axios.get(url).then(function(response){
    jsonVal = JSON.stringify(response.data)
    return jsonVal
  })
  return resp
}

app.get('/signup-school', async (req, res) => {  
  
  await getDropDowns('https://www.understem.com/schools').then(jsonVal => {
    val = JSON.parse(jsonVal)
    setCookies(process.env.COOKIE_SCHOOLS, res,jsonVal);    
  })

  await getDropDowns('https://www.understem.com/roles-at-school').then(jsonVal => {
    val = JSON.parse(jsonVal)
    setCookies(process.env.COOKIE_ROLES_AT_SCHOOL, res,jsonVal);    
  })

  res.sendFile(path.join(__dirname + '../dist/student-signup.html'));

});


app.get('/signup-alumni', async (req, res) => {  

    await getDropDowns(process.env.DOMAIN_URL).then(jsonVal => {
      val = JSON.parse(jsonVal)
      setCookies(process.env.COOKIE_SCHOOLS, res,jsonVal);    
    })


    res.sendFile(path.join(__dirname + '../ui/html/alumni-signup.html'));
});


app.get('/alumni-landing', async (req, res) => {
  response_type = LINKEDIN_OAUTH_CODE;
  scope=process.env.LINKEDIN_OAUTH_SCOPE;
  redirect_uri = process.env.DOMAIN_URL + process.env.LINKEDIN_CALLBACK_FUNCTION;
  client_id = process.env.LINKEDIN_OAUTH_CLIENT_ID;
  req.query["type"] = process.env.TYPE_ALUMNI
  req.query["user_school_id"] = req.query.user_school_id
  req.query["auth"] =  process.env.SIGNED_IN_USER
  state = JSON.stringify(req.query)
  linkedInUrl = process.env.LINKEDIN_REGISTER_URL
  registerUrl = process.env.linkedInUrl + `?state=${state}&client_id=${client_id}&response_type=${response_type}&scope=${scope}&redirect_uri=${redirect_uri}`
  res.redirect(registerUrl)  
});

app.get('/school-landing', async (req, res) => {  
  response_type = LINKEDIN_OAUTH_CODE;
  scope=process.env.LINKEDIN_OAUTH_SCOPE;
  redirect_uri = process.env.DOMAIN_URL + process.env.LINKEDIN_CALLBACK_FUNCTION;
  client_id = process.env.LINKEDIN_OAUTH_CLIENT_ID;
  req.query["type"] = process.env.TYPE_STUDENT
  req.query["user_school_id"] = req.query.user_school_id
  req.query["auth"] =  process.env.SIGNED_IN_USER
  state = JSON.stringify(req.query)
  linkedInUrl = process.env.LINKEDIN_REGISTER_URL
  registerUrl = process.env.linkedInUrl + `?state=${state}&client_id=${client_id}&response_type=${response_type}&scope=${scope}&redirect_uri=${redirect_uri}`
  res.redirect(registerUrl)  
});


function sendError(res, msg) {
  let rawdata = fs.readFileSync('./dist/common/error-400.json');
  let err = JSON.parse(rawdata);
  err.error.msg = err.error.msg + msg
  res.statusCode=403
  return err
}

app.get('/onboard-school', (req, res) => {  
  response_type = LINKEDIN_OAUTH_CODE;
  scope=process.env.LINKEDIN_OAUTH_SCOPE;
  redirect_uri = process.env.DOMAIN_URL + process.env.LINKEDIN_CALLBACK_FUNCTION;
  client_id = process.env.LINKEDIN_OAUTH_CLIENT_ID;
  req.query["type"] = process.env.TYPE_STUDENT
  req.query["user_school_id"] = req.query.user_school_id
  req.query["auth"] =  process.env.UNSIGNED_IN_USER
  state = JSON.stringify(req.query)
  linkedInUrl = process.env.LINKEDIN_REGISTER_URL
  registerUrl = process.env.linkedInUrl + `?state=${state}&client_id=${client_id}&response_type=${response_type}&scope=${scope}&redirect_uri=${redirect_uri}`
  res.redirect(registerUrl)  
});

app.get('/register-alumni', (req, res) => {  

    response_type = LINKEDIN_OAUTH_CODE;
    scope=process.env.LINKEDIN_OAUTH_SCOPE;
    redirect_uri = process.env.DOMAIN_URL + process.env.LINKEDIN_CALLBACK_FUNCTION;
    client_id = process.env.LINKEDIN_OAUTH_CLIENT_ID;
    req.query["type"] = process.env.TYPE_ALUMNI
    req.query["user_school_id"] = req.query.user_school_id
    req.query["auth"] =  process.env.UNSIGNED_IN_USER
    state = JSON.stringify(req.query)
    linkedInUrl = process.env.LINKEDIN_REGISTER_URL
    registerUrl = process.env.linkedInUrl + `?state=${state}&client_id=${client_id}&response_type=${response_type}&scope=${scope}&redirect_uri=${redirect_uri}`
    res.redirect(registerUrl)  
  });


  app.get('/signin-oauth-callback', async (req, res) => {
      // Begin Check with LinkedIn
      var mappedUserName 
      var displayName 
  
      redirect_uri = process.env.DOMAIN_URL + process.env.LINKEDIN_CALLBACK_FUNCTION;
      code=req.query.code
      grant_type= process.env.LINKEDIN_GRANT_TYPE
      client_id = process.env.LINKEDIN_CLIENT_ID
      client_secret = process.env.LINKEDIN_CLIENT_SECRET
      reqUrl = process.env.LINKEDIN_ACCESS_TOKEN_URL + `?code=${code}&client_id=${client_id}&client_secret=${client_secret}&redirect_uri=${redirect_uri}&grant_type=${grant_type}`
          
      request.post({
        headers: {
                  'Content-Type' : 'application/x-www-form-urlencoded'
                },
        url:     reqUrl,
      }, async function(error, response, body){
          if (error != null) {
            console.log(error)
            return null, null
          } 
        var access_token = JSON.parse(body).access_token
        if (access_token == null) {
          registerUrl = `process.env.UNDERSTEM_SINGIN_URL`
          res.redirect(registerUrl)  
          return
        }

        request.get({
          headers: {
                    'Content-Type' : 'application/x-www-form-urlencoded',
                    'Authorization' : `Bearer ${access_token}`
                  },
          url:     'process.env.LINKEDIN_OAUTH_ME_URL',
        }, async function(error, response, body){
          b = JSON.parse(body)
          mappedUserName = b.id
          displayName = b.localizedFirstName
          
          // TODO need to add code to search through all the college files

        console.log (' state is :::: ', req.query.state)
        state = JSON.parse(req.query.state)
        state1 = JSON.stringify(JSON.parse(req.query.state))

        console.log (' from cookie : ', req.cookies.user_school_id)
        var college_id = req.cookies.user_school_id

        if (college_id == null) {
          college_id = state.user_school_id
        }


          // 2. Check if the user already registered with the Understem
          let rawdata = fs.readFileSync('./dist/auth/auth.json')
          let authQ = JSON.parse(rawdata)
  
          if (state.auth == process.env.UNSIGNED_IN_USER) {
            shallAddUser = true
            // BEGIN Check if the user has already signedup
            if (mappedUserName != null && displayName != null) {          
              for (let i = 0; i < authQ.auth_info.length; i++) {
                if (authQ.auth_info[i].mapped_user_id == mappedUserName && 
                  authQ.auth_info[i].display_name == displayName) {
                    shallAddUser = false
                    break
                  }
                }
              }

                if (shallAddUser) {
                  newAuth =  {
                    "college_id": college_id,
                    "mapped_user_id" : mappedUserName,
                    "display_name" : displayName,
                    "major": state.major,
                    "current-domain": state1["current-domain"],
                    "contribute-skill-1" : state1["contribute-skill-1"],
                    "user_type" : state.type,
                    "created_on": new Date(new Date().getTime()).toUTCString(),      
                  }
                  authQ.auth_info.push(newAuth)        
                  fs.writeFileSync('./dist/auth.json', JSON.stringify(authQ));
        
                } else {
                  err = sendError(res, 'You are already signedup.. ')
                  res.json(err)
                  return        
                }
        } else if (state.auth == 'current') {
                isCurrentUser = false
                // BEGIN Check if the user has an Understem account
                if (mappedUserName != null && displayName != null) {          
                  for (let i = 0; i < authQ.auth_info.length; i++) {
                    if (authQ.auth_info[i].mapped_user_id == mappedUserName && 
                      authQ.auth_info[i].display_name == displayName && 
                      authQ.auth_info[i].user_type == state.type) {
                        college_id = authQ.auth_info[i].college_id
                        isCurrentUser = true
                        break
                      }
                    }
                    if (!isCurrentUser) {
                      if (state.type == 'alumni') {
                        res.redirect('/signup-alumni');
                      } else if (state.type == 'student') {
                        res.redirect('/signup-school');
                      }
                      return
                    } 
                }
        }  
        setCookies(process.env.COOKIE_DISPLAY_NAME, res, displayName);
        setCookies(process.env.COOKIE_MAPPED_USER_NAME, res, mappedUserName);
        setCookies(process.env.COOKIE_MAPPED_SCHOOL_ID, res, college_id);

        // Get calendar invite link
        let invites = fs.readFileSync('./dist/common/schools.json');
        let ii = JSON.parse(invites);
        for (let i = 0; i < ii.schools.length; i++) {
          if (ii.schools[i].id == college_id) {
            setCookies(process.env.COOKIE_MEETING_INVITE, res, ii.schools[i].calendar);
            setCookies(process.env.COOKIE_SCHOOL_NAME, res, ii.schools[i].school);
            break
          }
        }      

        if (state.type == process.env.TYPE_ALUMNI) {
          res.sendFile(path.join(__dirname + '/dist/alumni-landing.html'));
        } else if (state.type == process.env.TYPE_STUDENT) {
          res.sendFile(path.join(__dirname + '/dist/school-landing.html'));
        }
    })
})
})


var corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204 
}
app.use(cors(corsOptions));

function setCookies(name, res, val) {
  res.cookie(name, val, { domain: process.env.DOMAIN_NAME, path: '/' });
  return ''
}

app.get('/error', (req, res) => {
  res.sendFile(path.join(__dirname + '../dist/error.html'));
});

app.get('/image', (req, res) => {
  res.sendFile(path.join(__dirname + '../images/icon.png'));
});


https
  .createServer(
    {
      key: fs.readFileSync(process.env.UNDERSTEM_SERVICE_KEY_LOCATION),
      cert: fs.readFileSync(process.env.UNDERSTEM_SERVICE_CERTS_LOCATION),
    },
    app
  )
  .listen(process.env.UNDERSTEM_SERVICE_HTTPS_PORT, () => {
    console.log("serever is runing at port:" + process.env.UNDERSTEM_SERVICE_HTTPS_PORT);
  });

  