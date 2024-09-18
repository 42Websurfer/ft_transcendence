export function renderFooter(section)
{
    const app = document.getElementById('navbarFooter');
    app.innerHTML = `
<footer class="d-flex flex-wrap justify-content-between align-items-center custom-footer">
    <div class="col-md-4 d-flex align-items-center">
      <span class="text-body-secondary custom-footer-text">© 2024 WEBPONG</span>
    </div>
</footer>
    `;
}