const fs = require('fs')
const promisify = require('util').promisify
const { nextTutorialNumber, validateStringPresent, promptCreateFirst } = require('./utils.js')

const inquirer = require('inquirer')
const log = require('npmlog')

const run = require('../../modules/run')
const projects = require('../../../src/static/projects.json')
const tutorials = require('../../../src/static/tutorials.json')
const courses = require('../../../src/static/courses.json')

// customize log styling
log.addLevel('info', 2000, { fg: 'blue', bold: true }, '🧙‍♂️ ProtoWizard')

async function command (options) {
  log.info("Let's create the files you need to build your tutorial. We'll ask you a few questions to get started.")
  const responses = await inquirer
    .prompt([
      {
        type: 'input',
        name: 'title',
        message: 'What is the name of your new tutorial?',
        validate: validateStringPresent
      },
      {
        type: 'input',
        name: 'url',
        message: 'What is the URL for your tutorial? (Hit return to accept our suggestion.)',
        default: function (responses) {
          return responses.title.toLowerCase().split(' ').join('-')
        },
        validate: validateStringPresent
      },
      {
        type: 'list',
        name: 'project',
        message: 'Which project is your tutorial about?',
        choices: projects.map(project => ({name: project.name, value: project.id}))
      },
      {
        type: 'input',
        name: 'description',
        message: 'Please provide a short description for your tutorial to be displayed in tutorial listings.',
        validate: validateStringPresent
      }
    ])

  // determine new tutorial number
  const tutorialNumber = nextTutorialNumber()

  // create new directory
  await promisify(fs.mkdir)(`src/tutorials/${tutorialNumber}-${responses.url}`)

  // update all array in courses.json
  courses.all.push(tutorialNumber)
  await promisify(fs.writeFile)('src/static/courses.json', JSON.stringify(courses, null, 4))

  // add entry to tutorials.json
  const newTutorial = {
    url: responses.url,
    project: responses.project,
    title: responses.title,
    description: responses.description,
    newMessage: '',
    updateMessage: '',
    createdAt: new Date(),
    updatedAt: '',
    resources: []
  }

  tutorials[tutorialNumber] = newTutorial
  await promisify(fs.writeFile)('src/static/tutorials.json', JSON.stringify(tutorials, null, 4))

  // log success
  log.info(`Thanks! We've created a directory for your tutorial at \`src/tutorials/${tutorialNumber}-${responses.url}/\`.`)
  log.info(`Preview your tutorial by running \`npm start\` and visiting: http://localhost:3000/#/${responses.url}`)
  // suggest creating a lesson
  await promptCreateFirst('lesson', tutorialNumber)
}

run(command)
