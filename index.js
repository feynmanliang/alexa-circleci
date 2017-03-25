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
            });
            callback(speechLines);
        });
}

var handlers = {
    'CheckTestsIntent': function () {
        processCircleData(function (speechLines) {
            var speech = speechLines.join(', ');
            this.emit(':tell', speech);
        }.bind(this));
    }
}

exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.registerHandlers(handlers);
    alexa.execute();
}

