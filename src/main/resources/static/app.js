const resultElement = document.getElementById("result");
const num1Input = document.getElementById("num1");
const num2Input = document.getElementById("num2");
const addBtn = document.getElementById("addBtn");
const subtractBtn = document.getElementById("subtractBtn");
const multiplyBtn = document.getElementById("multiplyBtn");
const divideBtn = document.getElementById("divideBtn");

function setButtonsDisabled(disabled) {
    addBtn.disabled = disabled;
    subtractBtn.disabled = disabled;
    multiplyBtn.disabled = disabled;
    divideBtn.disabled = disabled;
}

function getInputs() {
    const num1 = Number.parseFloat(num1Input.value);
    const num2 = Number.parseFloat(num2Input.value);

    if (Number.isNaN(num1) || Number.isNaN(num2)) {
        throw new Error("Please enter valid numbers.");
    }

    return { num1, num2 };
}

async function calculate(operation) {
    const { num1, num2 } = getInputs();
    const body = new URLSearchParams({
        operation,
        num1: String(num1),
        num2: String(num2)
    });

    const response = await fetch("/api/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
       body
    });

    if (!response.ok) {
        throw new Error("Calculation request failed.");
    }

    const data = await response.json();
    if (data.error) {
        throw new Error(data.error);
    }

    resultElement.textContent = `Result: ${data.result}`;
}

async function onOperation(operation) {
    setButtonsDisabled(true);
    try {
        await calculate(operation);
    } catch (error) {
        resultElement.textContent = error.message;
    } finally {
        setButtonsDisabled(false);
    }
}

addBtn.addEventListener("click", () => onOperation("add"));
subtractBtn.addEventListener("click", () => onOperation("subtract"));
multiplyBtn.addEventListener("click", () => onOperation("multiply"));
divideBtn.addEventListener("click", () => onOperation("divide"));
