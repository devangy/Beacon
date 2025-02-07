
// 0, 1 , 1 , 2 , 3, 5, 8

function findFib(n) {
    let number1 = 0;
    let number2 = 1;
    
    for (let index = 2; index <= n; index++) {
        let nextNum = number1+number2
        number1 = number2
        number2 = nextNum
    }
    return number2;
    
}

const result = findFib(4);


console.log(result)