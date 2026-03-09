const elements = document.querySelectorAll('*');
const overlapping = [];

elements.forEach(el => {
  const style = window.getComputedStyle(el);
  const marginTop = parseFloat(style.marginTop);
  const transform = style.transform;
  
  if (marginTop < 0) {
    overlapping.push({ element: el.tagName + (el.id ? '#' + el.id : '') + (el.className ? '.' + el.className.split(' ').join('.') : ''), issue: 'negative margin-top', value: marginTop });
  }
  
  if (transform !== 'none' && transform.includes('matrix')) {
     const matrixValues = transform.match(/matrix.*\((.+)\)/)[1].split(', ');
     if (parseFloat(matrixValues[5]) < 0) {
        overlapping.push({ element: el.tagName + (el.id ? '#' + el.id : '') + (el.className ? '.' + el.className.split(' ').join('.') : ''), issue: 'negative translateY', value: matrixValues[5] });
     }
  }
});

console.log(JSON.stringify(overlapping, null, 2));
