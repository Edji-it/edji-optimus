var Reading = require("./../models/Reading")
var Q = require("q")

function updateReadings() {
  Q(Reading.find({ $where: "this.teacher_ids.length > 1" }).exec())
    .then((readings) => {
      readings.forEach((reading) => {
        console.log(reading.title)
        reading.teacher_ids = [reading.owner_id]

        reading.save((err, result) => {
          if (err) { console.error(err) }
          else { console.log("reading updated!") }
        })
      })
    })
    .then(() => {
      console.log("done!")
    })
    .catch((error) => {
      console.log(error)
    })
}

updateReadings()