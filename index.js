var Alexa = require('alexa-sdk');
var axios = require('axios');

var PAGINATION_SIZE = 3; // number of statuses spoken at a time, to avoid overwhelming user

function processCircleData(callback) {
    axios.get('https://circleci.com/api/v1.1/projects?circle-token='+process.env.CIRCLE_API_TOKEN)
        .then(function (res) {
            var unsuccessfulBuilds = res.data
                .map(function (project) {
                    return {
                        reponame: project.reponame.replace(/-/g, " "),
                        latestMasterBuild: project.branches.master.recent_builds[0].outcome.replace(/_/g, " ")
                    };
                })
                .filter(function (build) {
                    return build.latestMasterBuild !== 'success';
                });

            var speechLines = unsuccessfulBuilds.map(function (build) {
                return build.reponame + " has status " + build.latestMasterBuild;
            });

            callback(speechLines);
        });
}

function outputPage(prefix) {
    var output = prefix;
    output += this.attributes['speechLines']
        .slice(
            this.attributes['currentIndex'],
            this.attributes['currentIndex'] + PAGINATION_SIZE)
        .join(', ');
    this.attributes['currentIndex'] += PAGINATION_SIZE;
    if (this.attributes['speechLines'].length <= this.attributes['currentIndex']) {
        this.emit(':tell', output);
    } else {
        output += '. Do you want to hear more?';
        this.emit(':ask', output, 'Do you want to hear more?')
    }
}

var handlers = {
    'NewSession': function () {
        if(Object.keys(this.attributes).length === 0) { // check if first time skill has been invoked
            processCircleData(function (speechLines) {
                this.attributes['speechLines'] = speechLines;
                this.attributes['currentIndex'] = 0;

                if (this.attributes['speechLines'] === 0) {
                    this.emit(':tell', "Congratulations, all your builds are passing!");
                } else {
                    outputPage.call(this, "Uh oh, you've got some failing builds. ");
                }
            }.bind(this));
        } else {
            outputPage.call(this, "");
        }
    },

    'AMAZON.HelpIntent': function() {
        var message = 'Do you want me to tell you the status of your Circle c i builds?';
        this.emit(':ask', message, message);
    },

    'AMAZON.YesIntent': function() {
        outputPage.call(this, "");
    },

    'AMAZON.NoIntent': function() {
        this.emit(':tell', 'Ok, bye!');
    },

    'Unhandled': function() {
        this.emit(':ask', 'Sorry, I didn\'t get that. Try saying yes or no.', 'Try saying yes or no.');
    }
};

exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.registerHandlers(handlers);
    alexa.execute();
}

