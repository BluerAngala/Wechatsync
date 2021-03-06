// console.log('segmenftfault')
function testFunc() {
  console.log('api ready')
  var poster = {
    versionNumber: 1001,
  }

  var eventCb = {}
  function callFunc(msg, cb) {
    msg.eventID = Math.floor(Date.now() + Math.random() * 100)
    eventCb[msg.eventID] = function (err, res) {
      cb(err, res)
    }
    window.postMessage(JSON.stringify(msg), '*')
  }

  poster.getAccounts = function (cb) {
    callFunc(
      {
        method: 'getAccounts',
      },
      cb
    )
  }

  var _statueandler = null;

  poster.addTask = function(task, statueandler, cb) {
    _statueandler = statueandler;
    callFunc(
      {
        method: 'addTask',
        task: task,
      },
      cb
    )
  }

  poster.magicCall = function(data, cb) {
    callFunc(
      {
        method: 'magicCall',
        methodName: data.methodName,
        data: data,
      },
      cb
    )
  }

  poster.updateDriver = function(data, cb) {
    callFunc(
      {
        method: 'updateDriver',
        data: data,
      },
      cb
    )
  }

  poster.uploadImage = function(data, cb) {
    callFunc(
      {
        method: 'magicCall',
        methodName: 'uploadImage',
        data: data,
      },
      cb
    )
  }

  window.addEventListener('message', function (evt) {
    try {
      var action = JSON.parse(evt.data)
        if (action.method && action.method === 'taskUpdate') {
          if (_statueandler != null) _statueandler(action.task)
          return
        }
        if (!action.callReturn) return
      if (action.eventID && eventCb[action.eventID]) {
        eventCb[action.eventID](action.result)
        delete eventCb[action.eventID]
      }
    } catch (e) {}
  })

  window.$poster = poster
  window.$syncer = poster
}

setTimeout(function () {
  var script = document.createElement('script')
  script.type = 'text/javascript'
  script.innerHTML =
    ';(function() {  ' +
    testFunc.toString() +
    '; ' +
    testFunc.name +
    '(); ' +
    ' })();'
  document.head.appendChild(script)
  document.head.removeChild(script)
  console.log('injject')
}, 50)

var allAccounts = []
var accounts = []


function getAccounts(cb) {
  chrome.extension.sendMessage(
    {
      action: 'getAccount',
    },
    function (resp) {
      allAccounts = resp
      cb && cb()
    }
  )
}

if(window.location.href.indexOf('mp.weixin.qq.com') == -1) {
  // getAccounts()
}

function sendToWindow(msg) {
  msg.callReturn = true
  window.postMessage(JSON.stringify(msg), '*')
}


chrome.runtime.onMessage.addListener(function(request, sender, sendResponseA) {
  try {
    console.log('revice', request)
    if (request.method == 'taskUpdate') {
      // if(_statushandler != null) {
      //   _statushandler(request.task)
      // }
      // window.postMessage
      sendToWindow({
        task: request.task,
        method: 'taskUpdate',
      })
    }
  } catch (e) {
    console.log(e)
  }
})

var _statushandler = null;

window.addEventListener('message', function (evt) {
  // if (evt.origin == 'https://www.wechatsync.com') {
    // console.log('from page', evt)
    try {
      var action = JSON.parse(evt.data)
      if (action.method == 'getAccounts') {
        getAccounts(function() {
          sendToWindow({
            eventID: action.eventID,
            result: allAccounts,
          })
        })
      }

       if (action.method == 'addTask') {
        chrome.extension.sendMessage(
          {
            action: 'addTask',
            task: action.task,
          },
          function(resp) {
            console.log('addTask return', resp)
          }
        )
       }

       if (action.method == 'magicCall') {
         chrome.extension.sendMessage(
           {
             action: 'callDriverMethod',
             methodName: action.methodName,
             data: action.data,
           },
           function(resp) {
             sendToWindow({
               eventID: action.eventID,
               result: resp,
             })
           }
         )
       }

       if (action.method == 'updateDriver') {
         chrome.extension.sendMessage(
           {
             action: 'updateDriver',
             data: action.data,
           },
           function(resp) {
             sendToWindow({
               eventID: action.eventID,
               result: resp,
             })
           }
         )
       }

       
    } catch (e) {}
  // }
})
