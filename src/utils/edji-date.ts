// Available displayType: timeAgo, timeStamp
// Available timeFormat for timeStamp: longDate, mediumDate, shortDate
export default function transform(
  isoTime: string,
  displayType?: string,
  timeFormat?: string,
  triggerChange?: number,
): string {
  let time = new Date(isoTime)
  var months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]
  var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  var shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  var shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  if (displayType === 'timeAgo') {
    // Convert the passed in timestamp to a time ago format
    let now = new Date()
    let one_minute = 1000 * 60
    let one_second = 1000
    let secDiff = Math.abs(Math.ceil((time.getTime() - now.getTime()) / one_second))
    let minDiff = Math.abs(Math.ceil((time.getTime() - now.getTime()) / one_minute))
    let hourDiff
    let dayDiff
    let monthDiff = false
    let diffText = ''

    // check if more than 59 seconds ago
    if (secDiff > 59) {
      minDiff = Math.floor(secDiff / 60)
      secDiff = secDiff % 60
    }

    // check if more than 59 minutes ago
    if (minDiff > 59) {
      hourDiff = Math.floor(minDiff / 60)
      minDiff = minDiff % 60
    }

    // check if more than 23 hours ago
    if (hourDiff > 23) {
      dayDiff = Math.floor(hourDiff / 24)
      hourDiff = hourDiff % 60
    }

    // check if more than 31 days ago
    if (dayDiff > 31) {
      monthDiff = true
    }

    // if the time ago is more than 31 days ago, return a long date (April 21, 2017)
    if (monthDiff) {
      diffText = months[time.getMonth()] + ' ' + time.getDate() + ', ' + time.getFullYear()
      // if the time ago is more than 23 hours ago, then return the number of days ago
    } else if (typeof dayDiff !== 'undefined') {
      if (dayDiff === 1) {
        diffText += dayDiff + ' day ago'
      } else {
        diffText += dayDiff + ' days ago'
      }
      // if the time ago is more than 59 minutes ago, then return the number of hours ago
    } else if (typeof hourDiff !== 'undefined') {
      if (hourDiff === 1) {
        diffText += hourDiff + ' hour ago'
      } else {
        diffText += hourDiff + ' hours ago'
      }
      // if the time ago is less than 59 seconds ago, then return 'less than 1 min ago'
    } else if (minDiff < 1) {
      diffText += 'less than 1 min ago'
      // if the time ago is more than 59 seconds ago, then return the number of minutes ago
    } else if (minDiff == 1) {
      diffText += minDiff + ' min ago'
    } else {
      diffText += minDiff + ' mins ago'
    }

    // send back our time ago
    return diffText
  } else if (displayType === 'timeStamp') {
    // Convert the passed in timestamp to a friendly timestamp format
    let newTime

    if (typeof timeFormat !== 'undefined') {
      switch (timeFormat) {
        case 'longDate':
          // Converts the date to the following format: Friday April 21, 2017
          newTime =
            days[time.getDay()] + ' ' + months[time.getMonth()] + ' ' + time.getDate() + ', ' + time.getFullYear()
          break
        case 'mediumDate':
          // Converts the date to the following format: Fri Apr 21, 2017
          newTime = shortMonths[time.getMonth()] + ' ' + time.getDate() + ', ' + time.getFullYear()
          break
        case 'shortDate':
          // Converts the date to the following format: m/d/yyyy
          newTime = time.getMonth() + 1 + '/' + time.getDate() + '/' + time.getFullYear()
          break
      }
    } else {
      // If no format is specified, convert the date to the following format: m/d/yyyy
      newTime = time.getMonth() + 1 + '/' + time.getDate() + '/' + time.getFullYear()
    }

    return newTime
  } else {
    // Default case if the type of time format update is not selected, convert the date to the following format: m/d/yyyy
    return time.getMonth() + 1 + '/' + time.getDate() + '/' + time.getFullYear()
  }
}
