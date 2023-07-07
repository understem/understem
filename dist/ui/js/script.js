/* When the user clicks on the button,
toggle between hiding and showing the dropdown content */
function myDropDownFunction() {
  document.getElementById("myDropdown").classList.toggle("show");
}

// Close the dropdown menu if the user clicks outside of it
window.onclick = function(event) {
  if (!event.target.matches('.dropbtn')) {
    var dropdowns = document.getElementsByClassName("dropdown-content");
    var i;
    for (i = 0; i < dropdowns.length; i++) {
      var openDropdown = dropdowns[i];
      if (openDropdown.classList.contains('show')) {
        openDropdown.classList.remove('show');
      }
    }
  }
} 

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

var myApp = angular.module('MyApp', 
['ngCookies',  'ngMaterial', ]);

 var selectedVals = {};
myApp.controller('CollegeCtrl', function($scope, $cookies) 
{
  $scope.schMaster = JSON.parse($cookies.get('schools'))
  
  $scope.UpdateSchool = function(collection) {
    selectedVals.sch = collection
  }

  $scope.UpdateMajor = function(collection) {
    selectedVals.major = collection.major
    console.log (selectedVals.major)
  }

  $scope.UpdateDomain = function(collection) {
    console.log (collection.domain)
    selectedVals.domain = collection.domain
  }

  /*
  $scope.UpdateLinkedIn = function(profile) {
    selectedVals.lnkdProfile = profile
  }
  */

  $scope.UpdateSkill_1 = function(collection) {
    selectedVals.skill_1 = collection.skill
  }

  $scope.alumniOperation = function(hi) {
    window.location.replace(window.location.protocol  + '/alumni-operation' + '?op=op' ); 
  }

  $scope.alumniReg = function() {

    if (selectedVals.sch != null &&
      selectedVals.major != null &&
      selectedVals.domain != null &&
      selectedVals.skill_1 != null) {
        regUrl = window.location.protocol
        regUrl = regUrl + '/register-alumni'
        regUrl = regUrl +  '?user_school_id='
        regUrl = regUrl +  selectedVals.sch.id
        regUrl = regUrl +  '&school_name='
        regUrl = regUrl +  selectedVals.sch.school
        regUrl = regUrl +  '&major='
        regUrl = regUrl +  selectedVals.major
        regUrl = regUrl + '&current-domain='
        regUrl = regUrl +  selectedVals.domain
        regUrl = regUrl + '&contribute-skill-1='
        regUrl = regUrl +  selectedVals.skill_1
        
        console.log (regUrl)
        window.location.replace(regUrl);
    } else {
      console.log ('not done')
    }
  }
});

// College registration application
var collegeApp = angular.module('CollegeApp', 
['ngCookies',  'ngMaterial', ]);

 var onboardSchoolVals = {};
collegeApp.controller('CollegeCtrl', function($scope, $cookies) 
{
    // $scope.majors = JSON.parse($cookies.get('majors'))
    //  $scope.session_frequencies = JSON.parse($cookies.get('session-frequencies'))
  $scope.roles_at_school = JSON.parse($cookies.get('roles-at-school'))
  $scope.schMaster = JSON.parse($cookies.get('schools'))
  
  
  $scope.UpdateSchool = function(collection) {
    selectedVals.sch = collection
  //  $scope.$applyAsync(function () {
   //   $scope.selectedSchool = selectedVals.sch
//      console.log (selectedVals.sch)
//    });
  }

  $scope.UpdateRole = function(collection) {
    onboardSchoolVals.role = collection.role
    return collection
  }

  $scope.UpdateScope = function(collection) {    
    onboardSchoolVals.scope = collection.major
    return onboardSchoolVals.scope
  }

  /*
  $scope.UpdateFrequency = function(collection) {
    console.log (collection)
    onboardSchoolVals.frequency = collection.frequency
    return collection
  }
  */

  $scope.collegeReg = function() {
    if (selectedVals.sch != null &&
      onboardSchoolVals.role != null) {
        regUrl = window.location.protocol
        regUrl = regUrl + '/onboard-school'
        regUrl = regUrl +  '?user_school_id='
        regUrl = regUrl +  selectedVals.sch.id
        regUrl = regUrl +  '&school_name='
        regUrl = regUrl +  selectedVals.sch.school
        regUrl = regUrl +  '&college-role='
        regUrl = regUrl +  onboardSchoolVals.role
        window.location.replace(regUrl);
    } else {
      console.log ('not done')
    }
  }
});

// Landing app
var landingApp = angular.module('LandingApp', 
['ngCookies',  'ngMaterial']);

let notifier = new AWN()

landingApp.controller('LandingCtrl', function($scope, $cookies, $mdDialog) {

  netSelected = 0
  selectedQuestionId = -1
  $scope.ctrl.selectedIndex = 0;

  fetchAlumniSkills = function() {
    try {
      request = new XMLHttpRequest();
      request.open('GET', 'https://www.understem.com/alumni-skills', false);  // `false` makes the request synchronous
      request.send(null);
      $scope.alumni_skills = JSON.parse($cookies.get('alumni-skills'))
    } catch(err) {
      notifier.info('error in retrieving Alumin skills : ' + err)
    }  
  }

  fetchQuestions = function() {
    let t = $cookies.get('mapped_user_name')
    $.ajax({
      url: 'https://www.understem.com/open-questions?mapped_user_name='+t+'&type=alumni',
      async: false,
      success: function (data){
        $scope.$applyAsync(function () {
          $scope.alumni_token = $cookies.get('acesss_token')
          $scope.display_name = $cookies.get('display_name')  
          $scope.meeting_invite = $cookies.get('meeting_invite')  
          $scope.school_name = $cookies.get('school_name')  

          var removed = false
            if ($scope.questions != null) {            
            var arrayLength = $scope.questions.Student_Query.length;
            for (var i = 0; i < arrayLength; i++) {
                $scope.questions.Student_Query.pop();
                removed = true
            }
          } 

          if (removed) {
            updatedQuestions = JSON.parse(data).Student_Query          
            if (updatedQuestions != null && updatedQuestions.length > 0) {
              console.log ('before '+ $scope.questions)
              $scope.questions.Student_Query = []
              for (var j = 0; j < updatedQuestions.length; j++) {
                console.log (updatedQuestions[j])
                  $scope.questions.Student_Query.push(updatedQuestions[j]);
              }
            }
          } else {
            $scope.questions = JSON.parse(data)
          }
        });
      }, 
      error: function (xhr) {
          console.log ('got into error : ')
          flag = localStorage.getItem('shallAuth');

          if (flag == null || flag != '1') {
            localStorage.setItem('shallAuth', '1');
            window.location.replace(window.location.protocol  + '/register-alumni?only_auth=yes');   
        } else {
          localStorage.setItem('shallAuth', '0');
          window.location.replace(window.location.protocol  + '/error'); 
        }
      },
    })
}


  $scope.loadContent = function () {
    console.log ('loadContent')
    fetchAlumniSkills()
    fetchQuestions()
  }

  /*
    //all your init controller goodness in here
    this.$onInit = function () {
      fetchAlumniSkills()
      fetchQuestions('questions')
    }
    */

  $scope.checkForDisable = function () {
    if (netSelected > 0) {
      return false
    } else {
      selectedQuestionId = -1
      return true
    }
  }

  $scope.checkForHidingActionButtons = function () {
    const findQuestionIndex = $scope.questions.Student_Query.findIndex( (element) => element.isResolved === false);
    if (findQuestionIndex < 0) {
      return true
    } else {
      return false
    }
  }

  $scope.resolveQuestion = async function() {
    console.log ('coming to resolveQuestion')
    if (selectedQuestionId !=  -1) {
      try {  
          request.open('POST', 'https://www.understem.com/resolve-question?questionId='+selectedQuestionId, false);  // `false` makes the request synchronous
          request.send(null);
          console.log (request.status)
          if (request.status === 200) {
            fetchQuestions()
            $scope.taskCompleted = true;
            //window.location.reload();
            notifier.info('Successfully resolved your question')
          } else {
            console.log (request.response)
            fail = JSON.parse(request.response)
            notifier.info('error in resolving your question : ' + fail.error.msg) 
          }    
      } catch(err) {
          notifier.info('error in resolving your question : ' + err)
      }
    } else {
      console.log ('question : ' + $scope.newQuestion.length)
      console.log ('skill : ' + $scope.choosenSkill.length)
    }
  }

  $scope.selectQuestion = async function(event) {
    selectedQuestionId = event.target.value
    console.log (event.target.value)

    if (event.target.checked) {
      netSelected++
    } else {
      netSelected--
    }
  };


  $scope.ChooseSkill = function(selectedAlumniSkill) {
    $scope.choosenSkill = selectedAlumniSkill.skill
  }

  $scope.UpdateQuestion = function(qContent) {
    $scope.newQuestion = qContent
  }
  
  $scope.status = '  ';
  $scope.customFullscreen = true;

  $scope.showAdvanced = function () {
    $mdDialog.show({
      controller: this.controller,
      templateUrl: 'dialog1.tmpl.html',
      // Appending dialog to document.body to cover sidenav in docs app
      // Modal dialogs should fully cover application to prevent interaction outside of dialog
      parent: angular.element(document.body),
      clickOutsideToClose: true,
      fullscreen: $scope.customFullscreen // Only for -xs, -sm breakpoints.
    }).then(function (answer) {
      $scope.status = 'You said the information was "' + answer + '".';
    }, function () {
      $scope.status = 'You cancelled the dialog.';
    });
  }

});

// School app
var SchoolApp = angular.module('SchoolApp', 
['ngCookies',  'ngMaterial']);


SchoolApp.controller('SchoolCtrl', function($scope, $cookies, $mdDialog) {

  netSelected = 0
  selectedQuestionId = -1
  $scope.ctrl.selectedIndex = 1;

  fetchAlumniSkills = function() {
    try {
      request = new XMLHttpRequest();
      request.open('GET', 'https://www.understem.com/alumni-skills', false);  // `false` makes the request synchronous
      request.send(null);
      $scope.alumni_skills = JSON.parse($cookies.get('alumni-skills'))
    } catch(err) {
      notifier.info('error in retrieving Alumin skills : ' + err)
    }  
  }

  fetchQuestions = function() {
    let t = $cookies.get('mapped_user_name')
    $.ajax({
      url: 'https://www.understem.com/open-questions?mapped_user_name='+t+'&type=school',
      async: false,
      success: function (data){

        $scope.$applyAsync(function () {
          $scope.school_token = $cookies.get('acesss_token')
          $scope.display_name = $cookies.get('display_name')  
          $scope.meeting_invite = $cookies.get('meeting_invite')  
          $scope.school_name = $cookies.get('school_name')
          

          var removed = false
            if ($scope.questions != null) {            
            var arrayLength = $scope.questions.Student_Query.length;
            for (var i = 0; i < arrayLength; i++) {
                $scope.questions.Student_Query.pop();
                removed = true
            }
          } 

          if (removed) {
            updatedQuestions = JSON.parse(data).Student_Query          
            if (updatedQuestions != null && updatedQuestions.length > 0) {
              console.log ('before '+ $scope.questions)
              $scope.questions.Student_Query = []
              for (var j = 0; j < updatedQuestions.length; j++) {
                console.log (updatedQuestions[j])
                  $scope.questions.Student_Query.push(updatedQuestions[j]);
              }
            }
          } else {
            $scope.questions = JSON.parse(data)
          }
        });
      }, 
      error: function (xhr) {
          console.log ('got into error : ')
           flag = localStorage.getItem('shallAuth');

          if (flag == null || flag != '1') {
            localStorage.setItem('shallAuth', '1');
            window.location.replace(window.location.protocol  + '/onboard-school?only_auth=yes'); 
          } else {
            localStorage.setItem('shallAuth', '0');
            window.location.replace(window.location.protocol  + '/error'); 
          }
      }
    })
}

  $scope.loadContent = function () {
    fetchAlumniSkills()
    fetchQuestions()
  }

  /*
    //all your init controller goodness in here
    this.$onInit = function () {
      fetchAlumniSkills()
      fetchQuestions('questions')
    }
    */


  $scope.checkForDisable = function () {
    if (netSelected > 0) {
      return false
    } else {
      selectedQuestionId = -1
      return true
    }
  }

  $scope.checkForHidingActionButtons = function () {
    const findQuestionIndex = $scope.questions.Student_Query.findIndex( (element) => element.isResolved === false);
    if (findQuestionIndex < 0) {
      return true
    } else {
      return false
    }
  }

  $scope.deleteQuestion = async function() {
    if (selectedQuestionId !=  -1) {
      try {  
          request.open('POST', 'https://www.understem.com/delete-question?questionId='+selectedQuestionId, false);  // `false` makes the request synchronous
          request.send(null);
          console.log (request.status)
          if (request.status === 200) {
            fetchQuestions()
            //window.location.reload();
            $scope.taskCompleted = true;
            notifier.info('Successfully deleted your question')
          } else {
            console.log (request.response)
            fail = JSON.parse(request.response)
            notifier.info('error in deleting your question : ' + fail.error.msg) 
          }    
      } catch(err) {
          notifier.info('error in deleting your question : ' + err)
      }
    } else {
      console.log ('question : ' + $scope.newQuestion.length)
      console.log ('skill : ' + $scope.choosenSkill.length)
    }
  }

  $scope.selectQuestion = async function(event) {
    selectedQuestionId = event.target.value
    console.log (event.target.value)

    if (event.target.checked) {
      netSelected++
    } else {
      netSelected--
    }
  };
  
  $scope.submitQuestion = async function() {

    if ($scope.choosenSkill.length != 0 && $scope.newQuestion.length > 0) {
        submitUrl = 'https://www.understem.com/submit-question?skill='+$scope.choosenSkill+'&question='+ $scope.newQuestion

        $.ajax({
          url: submitUrl,
          type: "POST",
          async: false,
          success: function (data){
            fetchQuestions()
            $scope.taskCompleted = true;
            notifier.info('Successfully submitted your question')
            $scope.ctrl.selectedIndex = 1;
            //window.location.reload()
          }, 
          error: function (xhr) {
            console.log (request.response)
            fail = JSON.parse(request.response)
            notifier.info('error in submitting your question : ' + fail.error.msg) 
        }
      })
  }
}

  $scope.ChooseSkill = function(selectedAlumniSkill) {
    $scope.choosenSkill = selectedAlumniSkill.skill
  }

  $scope.UpdateQuestion = function(qContent) {
    $scope.newQuestion = qContent
  }
  
  $scope.status = '  ';
  $scope.customFullscreen = true;

  $scope.showAdvanced = function () {
    $mdDialog.show({
      controller: this.controller,
      templateUrl: 'dialog1.tmpl.html',
      // Appending dialog to document.body to cover sidenav in docs app
      // Modal dialogs should fully cover application to prevent interaction outside of dialog
      parent: angular.element(document.body),
      clickOutsideToClose: true,
      fullscreen: $scope.customFullscreen // Only for -xs, -sm breakpoints.
    }).then(function (answer) {
      $scope.status = 'You said the information was "' + answer + '".';
    }, function () {
      $scope.status = 'You cancelled the dialog.';
    });
  }

});
