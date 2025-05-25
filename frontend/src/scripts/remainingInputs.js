// SCRIPT PARA MANEJAR LOS INPUTS RESTANTES Y EL CONTADOR
document.addEventListener('DOMContentLoaded', () => {
    const remainingInputs = document.getElementById('remainingInputs');
    const submitButton = document.getElementById('submitButton');

    let inputsLeft = 3; // Inputs de prueba restantes

    // Recuperar el estado de los inputs restantes desde localStorage al cargar la página
    const savedInputsLeft = localStorage.getItem('inputsLeft');
    if (savedInputsLeft) {
        inputsLeft = parseInt(savedInputsLeft, 10);
        remainingInputs.textContent = inputsLeft;
    } else {
        remainingInputs.textContent = inputsLeft; // Mostrar el valor inicial de los inputs que le quedan al usuario
    }

    // Deshabilitar el botón si nole quedan más inputs al usuario
    if (savedInputsLeft <= 0) {
        submitButton.disabled = true;
    }

    // Actualizar el contador de inputs restantes
    submitButton.addEventListener('click', () => {
        if (inputsLeft > 0) {
            inputsLeft--;
            remainingInputs.textContent = inputsLeft;
            localStorage.setItem('inputsLeft', inputsLeft); // Guardar los inputs que le quedan al usuario en localStorage
        } else {
            alert('No tienes más inputs de prueba disponibles.');
            submitButton.disabled = true; // Deshabilitar el botón si no hay inputs restantes
        }
    });

    // Manejo de la tecla Enter
    document.getElementById('input-text').addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            if (inputsLeft > 0 && !submitButton.disabled) {
                enviarDatos();
            }
        }
    });
});