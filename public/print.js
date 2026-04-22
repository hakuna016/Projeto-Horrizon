(function () {
  const PRINT_JOB_STORAGE_KEY = "horizon-print-jobs-v1";
  const PRINT_JOB_TTL_MS = 15 * 60 * 1000;
  const PRINT_WAIT_TIMEOUT_MS = 30 * 1000;
  const PRINT_POLL_INTERVAL_MS = 200;

  const refs = {
    status: document.getElementById("print-status"),
    statusTitle: document.getElementById("print-status-title"),
    statusDescription: document.getElementById("print-status-description"),
    closeButton: document.getElementById("print-status-close"),
    root: document.getElementById("print-root"),
  };

  let currentJobId = "";
  let currentJob = null;
  let hasTriggeredPrint = false;
  let pollTimer = null;
  let waitTimer = null;

  document.addEventListener("DOMContentLoaded", initialize);

  function initialize() {
    const params = new URLSearchParams(window.location.search);
    currentJobId = String(params.get("job") || "").trim();

    refs.closeButton?.addEventListener("click", () => window.close());
    window.addEventListener("storage", handleStorageSync);
    window.addEventListener("afterprint", handleAfterPrint);

    if (!currentJobId) {
      renderError("Nenhum documento de impressao foi informado para esta tela.");
      return;
    }

    syncCurrentJob();
    pollTimer = window.setInterval(syncCurrentJob, PRINT_POLL_INTERVAL_MS);
    waitTimer = window.setTimeout(() => {
      if (!currentJob || currentJob.status !== "ready") {
        stopWaiting();
        renderError("O documento demorou mais do que o esperado para ficar pronto. Feche esta janela e tente novamente.");
      }
    }, PRINT_WAIT_TIMEOUT_MS);
  }

  function readPrintJobs() {
    try {
      return JSON.parse(window.localStorage.getItem(PRINT_JOB_STORAGE_KEY) || "{}");
    } catch (error) {
      return {};
    }
  }

  function writePrintJobs(jobs) {
    window.localStorage.setItem(PRINT_JOB_STORAGE_KEY, JSON.stringify(jobs));
  }

  function cleanupPrintJobs(existingJobs = readPrintJobs()) {
    const now = Date.now();
    const nextJobs = Object.entries(existingJobs).reduce((result, [jobId, job]) => {
      const updatedAt = Number(job?.updatedAt || 0);
      if (updatedAt && now - updatedAt <= PRINT_JOB_TTL_MS) {
        result[jobId] = job;
      }
      return result;
    }, {});

    if (JSON.stringify(nextJobs) !== JSON.stringify(existingJobs)) {
      writePrintJobs(nextJobs);
    }

    return nextJobs;
  }

  function getCurrentJob() {
    const jobs = cleanupPrintJobs();
    return jobs[currentJobId] || null;
  }

  function removeCurrentJob() {
    const jobs = readPrintJobs();
    if (!jobs[currentJobId]) {
      return;
    }

    delete jobs[currentJobId];
    writePrintJobs(jobs);
  }

  function stopWaiting() {
    if (pollTimer) {
      window.clearInterval(pollTimer);
      pollTimer = null;
    }

    if (waitTimer) {
      window.clearTimeout(waitTimer);
      waitTimer = null;
    }
  }

  function syncCurrentJob() {
    const job = getCurrentJob();
    currentJob = job;

    if (!job) {
      renderStatus("Preparando impressao", "Aguardando os dados do relatorio...");
      return;
    }

    if (job.status === "error") {
      renderError(job.message || "Nao foi possivel preparar o documento para impressao.");
      stopWaiting();
      return;
    }

    if (job.status === "ready") {
      renderReady(job);
      stopWaiting();
      return;
    }

    renderStatus(job.title || "Preparando impressao", job.message || "Montando o documento para impressao...");
  }

  function renderStatus(title, description) {
    document.title = "HORIZON | Impressao";
    refs.status.dataset.state = "loading";
    refs.statusTitle.textContent = title;
    refs.statusDescription.textContent = description;
    refs.status.classList.remove("hidden");
    refs.root.classList.add("hidden");
  }

  function renderError(message) {
    document.title = "HORIZON | Falha na impressao";
    refs.status.dataset.state = "error";
    refs.statusTitle.textContent = "Falha ao abrir impressao";
    refs.statusDescription.textContent = message;
    refs.status.classList.remove("hidden");
    refs.root.innerHTML = "";
    refs.root.classList.add("hidden");
  }

  function renderReady(job) {
    document.title = job.title || "HORIZON | Impressao";
    refs.root.innerHTML = job.html || "";
    refs.root.classList.remove("hidden");
    refs.status.classList.add("hidden");

    if (!hasTriggeredPrint) {
      schedulePrint(job);
    }
  }

  function schedulePrint(job) {
    hasTriggeredPrint = true;
    const triggerPrint = () => {
      window.requestAnimationFrame(() => {
        window.setTimeout(() => {
          try {
            window.focus();
          } catch (error) {
            // Mantem a impressao mesmo se o navegador recusar o foco.
          }
          window.print();
        }, 180);
      });
    };

    if (document.fonts?.ready) {
      document.fonts.ready.then(triggerPrint).catch(triggerPrint);
      return;
    }

    window.setTimeout(triggerPrint, 120);
  }

  function handleStorageSync(event) {
    if (event.key === PRINT_JOB_STORAGE_KEY) {
      syncCurrentJob();
    }
  }

  function handleAfterPrint() {
    if (currentJob?.autoClose === false) {
      return;
    }

    removeCurrentJob();
    window.setTimeout(() => window.close(), 120);
  }
})();
