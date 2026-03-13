const message = document.getElementById("message");
const actionBtn = document.getElementById("actionBtn");

message.textContent = "Your app is running.";

actionBtn.addEventListener("click", () => {
  message.textContent = `Clicked at ${new Date().toLocaleTimeString()}`;
});
