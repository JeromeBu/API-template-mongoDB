function corsicaRandom(array, i) {
  if (i === 0) {
    console.log('link to teacher n°1')
    return array[0]
  }
  return array[Math.floor(Math.random() * (array.length - 1) + 1)]
}

function randomFromTable(array) {
  return array[Math.floor(Math.random() * array.length)]
}

function randomDate(start, end, startHour, endHour) {
  const date = new Date(+start + Math.random() * (end - start))
  if (startHour && endHour) {
    const hour = startHour + Math.random() * (endHour - startHour) || 0
    date.setHours(hour)
  }
  return date
}

function roundMinutes(date) {
  date.setHours(date.getHours() + Math.round(date.getMinutes() / 60))
  date.setMinutes(0)
  return date
}

function pluck(array, key) {
  return array.map(element => element[key])
}

module.exports = {
  corsicaRandom,
  randomFromTable,
  randomDate,
  roundMinutes,
  pluck
}
