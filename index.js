var Alexa = require('alexa-sdk');
var axios = require('axios');

function processCircleData(callback) {
    axios.get('https://circleci.com/api/v1.1/projects?circle-token='+process.env.CIRCLE_API_TOKEN)
        .then(function (res) {
            var buildStatuses = res.data.map(function (project) {
                return {
                    reponame: project.reponame,
                    latestMasterBuild: project.branches.master.recent_builds[0].outcome
                };
            });
            var speechLines = buildStatuses.map(function (build) {
                return "Repository " + build.reponame.replace(/-/g, " ")
                    + " has status " + build.latestMasterBuild
            })
        });
}

var handlers = {
    'CheckTestsIntent': function () {
        var speech = processCircleData(function (speechLines) {
            return speechLines.join(', ');
        })
        this.emit(':tell', speech);
    }
}

exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.registerHandlers(handlers);
    alexa.execute();
}

