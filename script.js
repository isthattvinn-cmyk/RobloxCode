const STORAGE_KEY = "textai-roblox-studio-v1";

const presetPrompts = [
  {
    title: "Combat Upgrade",
    description: "Add combo finishers, cooldown checks, and keep the old hitbox flow.",
    prompt: "Upgrade my combat script with combo finishers and dash cooldowns, but keep the current hitbox and damage flow."
  },
  {
    title: "Advanced Datastore",
    description: "Build robust save logic with retries, profiles, and leaderstats sync.",
    prompt: "Create advanced Roblox datastore code with retries, autosave, profile loading, and leaderstats sync."
  },
  {
    title: "Admin System",
    description: "Make command parsing, rank checks, logs, and moderation tools.",
    prompt: "Build an advanced Roblox admin command system with rank checks, moderation logs, and clean command parsing."
  },
  {
    title: "Quest System",
    description: "Add quest tracking without breaking inventory or XP systems.",
    prompt: "Add a quest system that works with inventory and XP, and do not rewrite the existing progression code."
  }
];

const refs = {
  sessionList: document.querySelector("#sessionList"),
  presetPrompts: document.querySelector("#presetPrompts"),
  sessionCount: document.querySelector("#sessionCount"),
  messageCount: document.querySelector("#messageCount"),
  versionCount: document.querySelector("#versionCount"),
  memoryUpdated: document.querySelector("#memoryUpdated"),
  goalInput: document.querySelector("#goalInput"),
  constraintsInput: document.querySelector("#constraintsInput"),
  systemsInput: document.querySelector("#systemsInput"),
  chatLog: document.querySelector("#chatLog"),
  composerForm: document.querySelector("#composerForm"),
  promptInput: document.querySelector("#promptInput"),
  preserveToggle: document.querySelector("#preserveToggle"),
  codeEditor: document.querySelector("#codeEditor"),
  assistantNotes: document.querySelector("#assistantNotes"),
  versionList: document.querySelector("#versionList"),
  newSessionButton: document.querySelector("#newSessionButton"),
  seedStarterButton: document.querySelector("#seedStarterButton"),
  saveVersionButton: document.querySelector("#saveVersionButton"),
  clearChatButton: document.querySelector("#clearChatButton"),
  clearStorageButton: document.querySelector("#clearStorageButton"),
  copyCodeButton: document.querySelector("#copyCodeButton"),
  messageTemplate: document.querySelector("#messageTemplate")
};

const state = loadState();

function createId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function createDefaultCode() {
  return `-- TextAI Roblox Starter
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Remotes = ReplicatedStorage:WaitForChild("Remotes")
local AttackEvent = Remotes:WaitForChild("AttackEvent")

local CombatService = {}
CombatService.ComboWindow = 1
CombatService.ComboReset = 1.25
CombatService.Cooldowns = {}

local playerState = {}

local function getPlayerState(player)
  if not playerState[player] then
    playerState[player] = {
      combo = 0,
      lastAttack = 0,
      stamina = 100,
    }
  end

  return playerState[player]
end

function CombatService:CanAttack(player)
  local state = getPlayerState(player)
  local now = os.clock()

  if self.Cooldowns[player] and self.Cooldowns[player] > now then
    return false
  end

  if now - state.lastAttack > self.ComboReset then
    state.combo = 0
  end

  return true
end

function CombatService:RegisterAttack(player)
  local state = getPlayerState(player)
  state.combo = math.clamp(state.combo + 1, 1, 4)
  state.lastAttack = os.clock()
  self.Cooldowns[player] = os.clock() + 0.2

  return state.combo
end

AttackEvent.OnServerEvent:Connect(function(player, payload)
  if not CombatService:CanAttack(player) then
    return
  end

  local comboIndex = CombatService:RegisterAttack(player)
  print(player.Name, "used combo hit", comboIndex, payload and payload.moveType)
end)

Players.PlayerRemoving:Connect(function(player)
  playerState[player] = nil
  CombatService.Cooldowns[player] = nil
end)

return CombatService
`;
}

function createSession(title = "New Roblox Build") {
  const timestamp = nowIso();
  const starterCode = createDefaultCode();

  return {
    id: createId("session"),
    title,
    createdAt: timestamp,
    updatedAt: timestamp,
    memory: {
      goal: "Advanced Roblox code that can keep growing without wiping older systems.",
      constraints: "Preserve working code and update it in-place.",
      systems: "Combat, remotes, player data, UI hooks"
    },
    messages: [
      {
        id: createId("message"),
        role: "assistant",
        content: "This workspace remembers the project. Ask for starter scripts, upgrades, bug fixes, or advanced systems, and the code canvas will keep evolving instead of restarting.",
        createdAt: timestamp
      }
    ],
    notes: [
      {
        id: createId("note"),
        title: "Memory-first editing",
        content: "Chat history, project memory, and code versions are saved locally in your browser so the next prompt can build on the last one."
      },
      {
        id: createId("note"),
        title: "Update behavior",
        content: "When preserve mode is on, the assistant appends or upgrades sections and keeps the existing draft in the editor."
      }
    ],
    codeDraft: starterCode,
    versions: [
      {
        id: createId("version"),
        title: "Initial starter combat service",
        summary: "Created a base server-side combat service with combo tracking and cooldown management.",
        code: starterCode,
        createdAt: timestamp
      }
    ]
  };
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    const defaultSession = createSession("Arena Combat Build");
    return {
      activeSessionId: defaultSession.id,
      sessions: [defaultSession]
    };
  }

  try {
    const parsed = JSON.parse(raw);

    if (!parsed.sessions?.length) {
      throw new Error("Missing sessions");
    }

    return parsed;
  } catch (error) {
    const recoverySession = createSession("Recovered Roblox Build");
    return {
      activeSessionId: recoverySession.id,
      sessions: [recoverySession]
    };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getActiveSession() {
  return state.sessions.find((session) => session.id === state.activeSessionId) || state.sessions[0];
}

function formatRelative(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function truncate(value, max = 72) {
  if (value.length <= max) {
    return value;
  }

  return `${value.slice(0, max - 1)}...`;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderSessions() {
  refs.sessionList.innerHTML = "";

  state.sessions.forEach((session) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `session-item${session.id === state.activeSessionId ? " active" : ""}`;
    button.dataset.sessionId = session.id;
    button.innerHTML = `
      <div class="session-head">
        <strong>${escapeHtml(session.title)}</strong>
        <span class="session-meta">${session.versions.length} versions</span>
      </div>
      <p>${escapeHtml(truncate(session.memory.goal || "No project goal yet.", 84))}</p>
      <span class="session-meta">Updated ${formatRelative(session.updatedAt)}</span>
    `;
    refs.sessionList.append(button);
  });
}

function renderPresets() {
  refs.presetPrompts.innerHTML = "";

  presetPrompts.forEach((preset) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "preset-chip";
    button.innerHTML = `
      <strong>${escapeHtml(preset.title)}</strong>
      <p>${escapeHtml(preset.description)}</p>
    `;
    button.addEventListener("click", () => {
      refs.promptInput.value = preset.prompt;
      refs.promptInput.focus();
    });
    refs.presetPrompts.append(button);
  });
}

function renderMemory(session) {
  refs.goalInput.value = session.memory.goal;
  refs.constraintsInput.value = session.memory.constraints;
  refs.systemsInput.value = session.memory.systems;
  refs.memoryUpdated.textContent = `Updated ${formatRelative(session.updatedAt)}`;
}

function renderChat(session) {
  refs.chatLog.innerHTML = "";

  if (!session.messages.length) {
    refs.chatLog.innerHTML = `<div class="empty-state">No chat yet. Ask for Roblox code, updates, or advanced systems.</div>`;
    return;
  }

  session.messages.forEach((message) => {
    const fragment = refs.messageTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".message-card");
    const roleStrong = fragment.querySelector("strong");
    const time = fragment.querySelector("span");
    const body = fragment.querySelector("p");

    card.classList.add(message.role);
    roleStrong.textContent = message.role === "user" ? "You" : "TextAI";
    time.textContent = formatRelative(message.createdAt);
    body.textContent = message.content;

    refs.chatLog.append(fragment);
  });

  refs.chatLog.scrollTop = refs.chatLog.scrollHeight;
}

function renderNotes(session) {
  refs.assistantNotes.innerHTML = "";

  session.notes.forEach((note) => {
    const card = document.createElement("article");
    card.className = "note-card";
    card.innerHTML = `
      <h3>${escapeHtml(note.title)}</h3>
      <p>${escapeHtml(note.content)}</p>
    `;
    refs.assistantNotes.append(card);
  });
}

function renderVersions(session) {
  refs.versionList.innerHTML = "";

  if (!session.versions.length) {
    refs.versionList.innerHTML = `<div class="empty-state">No saved versions yet. Save a snapshot after a good update.</div>`;
    return;
  }

  [...session.versions].reverse().forEach((version) => {
    const card = document.createElement("article");
    card.className = "version-card";
    card.innerHTML = `
      <div class="version-top">
        <div>
          <strong>${escapeHtml(version.title)}</strong>
          <p>${escapeHtml(version.summary)}</p>
        </div>
        <time>${formatRelative(version.createdAt)}</time>
      </div>
      <pre>${escapeHtml(truncate(version.code, 220))}</pre>
      <div class="version-actions">
        <button class="button" type="button" data-restore-version="${version.id}">Restore</button>
      </div>
    `;
    refs.versionList.append(card);
  });
}

function renderStats(session) {
  refs.sessionCount.textContent = String(state.sessions.length);
  refs.messageCount.textContent = String(session.messages.length);
  refs.versionCount.textContent = String(session.versions.length);
}

function renderEditor(session) {
  refs.codeEditor.value = session.codeDraft;
}

function renderApp() {
  const session = getActiveSession();
  renderSessions();
  renderMemory(session);
  renderChat(session);
  renderNotes(session);
  renderVersions(session);
  renderStats(session);
  renderEditor(session);
}

function updateSessionTimestamp(session) {
  session.updatedAt = nowIso();
}

function addMessage(session, role, content) {
  session.messages.push({
    id: createId("message"),
    role,
    content,
    createdAt: nowIso()
  });
}

function addNote(session, title, content) {
  session.notes.unshift({
    id: createId("note"),
    title,
    content
  });

  session.notes = session.notes.slice(0, 5);
}

function saveVersion(session, title, summary) {
  session.versions.push({
    id: createId("version"),
    title,
    summary,
    code: session.codeDraft,
    createdAt: nowIso()
  });
}

function ensureSessionTitle(session, prompt) {
  if (session.title === "New Roblox Build" || session.title === "Arena Combat Build" || session.title === "Recovered Roblox Build") {
    session.title = toTitleFromPrompt(prompt);
  }
}

function toTitleFromPrompt(prompt) {
  const cleaned = prompt.replace(/[^a-z0-9\s]/gi, "").trim();
  if (!cleaned) {
    return "Roblox AI Build";
  }

  return truncate(
    cleaned
      .split(/\s+/)
      .slice(0, 4)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" "),
    28
  );
}

function inferMemoryFromPrompt(prompt, memory) {
  const lower = prompt.toLowerCase();
  const systems = new Set(
    memory.systems
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  );

  const keywordMap = {
    combat: "Combat",
    quest: "Quest system",
    inventory: "Inventory",
    datastore: "Datastore",
    admin: "Admin commands",
    npc: "NPC dialogue",
    dash: "Movement skills",
    leaderboard: "Leaderstats",
    ability: "Ability system",
    pet: "Pet system",
    trade: "Trading"
  };

  Object.entries(keywordMap).forEach(([keyword, label]) => {
    if (lower.includes(keyword)) {
      systems.add(label);
    }
  });

  if (!memory.goal || memory.goal.startsWith("Advanced Roblox code")) {
    memory.goal = truncate(prompt, 120);
  }

  if (lower.includes("keep") || lower.includes("dont rewrite") || lower.includes("don't rewrite") || lower.includes("preserve")) {
    memory.constraints = truncate(prompt, 140);
  }

  memory.systems = Array.from(systems).join(", ");
}

function buildSystemSnippet(prompt) {
  const lower = prompt.toLowerCase();

  if (lower.includes("datastore") || lower.includes("save")) {
    return {
      title: "Advanced datastore profile service",
      summary: "Added retry-based profile loading and autosave helpers.",
      code: `local DataStoreService = game:GetService("DataStoreService")
local Players = game:GetService("Players")

local ProfileStore = DataStoreService:GetDataStore("PlayerProfiles_V1")
local ProfileService = {}
ProfileService.Cache = {}
ProfileService.AutoSaveInterval = 60
ProfileService.MaxRetries = 3

local function deepCopy(value)
  if type(value) ~= "table" then
    return value
  end

  local clone = {}
  for key, nested in pairs(value) do
    clone[key] = deepCopy(nested)
  end
  return clone
end

function ProfileService:DefaultProfile()
  return {
    Coins = 0,
    Gems = 0,
    Level = 1,
    XP = 0,
    Inventory = {},
    Quests = {},
  }
end

function ProfileService:LoadProfile(player)
  local key = "Player_" .. player.UserId

  for attempt = 1, self.MaxRetries do
    local success, data = pcall(function()
      return ProfileStore:GetAsync(key)
    end)

    if success then
      self.Cache[player] = data or self:DefaultProfile()
      return self.Cache[player]
    end

    task.wait(1 + attempt)
  end

  self.Cache[player] = deepCopy(self:DefaultProfile())
  return self.Cache[player]
end

function ProfileService:SaveProfile(player)
  local profile = self.Cache[player]
  if not profile then
    return
  end

  local key = "Player_" .. player.UserId
  pcall(function()
    ProfileStore:SetAsync(key, profile)
  end)
end

task.spawn(function()
  while true do
    task.wait(ProfileService.AutoSaveInterval)
    for _, player in ipairs(Players:GetPlayers()) do
      ProfileService:SaveProfile(player)
    end
  end
end)

return ProfileService`
    };
  }

  if (lower.includes("admin") || lower.includes("moderation") || lower.includes("command")) {
    return {
      title: "Advanced admin command framework",
      summary: "Added ranked admin commands with parsing and moderation actions.",
      code: `local Players = game:GetService("Players")

local AdminService = {}
AdminService.Prefix = ";"
AdminService.Ranks = {
  [12345678] = "Owner",
}

AdminService.Commands = {}

local rankPower = {
  Moderator = 1,
  Admin = 2,
  Owner = 3,
}

function AdminService:GetRank(player)
  return self.Ranks[player.UserId] or "Player"
end

function AdminService:CanUse(player, minimumRank)
  return (rankPower[self:GetRank(player)] or 0) >= (rankPower[minimumRank] or math.huge)
end

function AdminService:RegisterCommand(name, minimumRank, callback)
  self.Commands[string.lower(name)] = {
    minimumRank = minimumRank,
    callback = callback,
  }
end

function AdminService:Run(player, message)
  if string.sub(message, 1, #self.Prefix) ~= self.Prefix then
    return
  end

  local args = string.split(string.sub(message, #self.Prefix + 1), " ")
  local commandName = string.lower(table.remove(args, 1) or "")
  local command = self.Commands[commandName]

  if not command then
    return
  end

  if not self:CanUse(player, command.minimumRank) then
    return
  end

  command.callback(player, args)
end

AdminService:RegisterCommand("kick", "Moderator", function(player, args)
  local targetName = args[1]
  for _, target in ipairs(Players:GetPlayers()) do
    if string.lower(target.Name) == string.lower(targetName or "") then
      target:Kick("Removed by " .. player.Name)
      break
    end
  end
end)

return AdminService`
    };
  }

  if (lower.includes("quest")) {
    return {
      title: "Quest tracking system",
      summary: "Added repeatable quest definitions and objective progress tracking.",
      code: `local QuestService = {}
QuestService.Definitions = {
  BanditHunt = {
    title = "Bandit Hunt",
    description = "Defeat 5 bandits outside the village.",
    objectives = {
      {
        id = "BanditsDefeated",
        required = 5,
      }
    },
    rewards = {
      Coins = 250,
      XP = 80,
    }
  }
}

function QuestService:EnsureProfile(profile)
  profile.Quests = profile.Quests or {}
end

function QuestService:AcceptQuest(profile, questId)
  self:EnsureProfile(profile)
  if not self.Definitions[questId] then
    return
  end

  profile.Quests[questId] = profile.Quests[questId] or {
    status = "Active",
    progress = {},
  }
end

function QuestService:AddProgress(profile, questId, objectiveId, amount)
  self:EnsureProfile(profile)
  local questData = profile.Quests[questId]
  if not questData then
    return
  end

  questData.progress[objectiveId] = (questData.progress[objectiveId] or 0) + amount
end

return QuestService`
    };
  }

  return {
    title: "Advanced combat upgrade",
    summary: "Extended the current combat service with richer state and preserved the original attack flow.",
    code: `local RunService = game:GetService("RunService")

local CombatRuntime = {}
CombatRuntime.ActiveStates = {}
CombatRuntime.DashCooldown = 1.5
CombatRuntime.FinisherThreshold = 4

function CombatRuntime:GetState(player)
  self.ActiveStates[player] = self.ActiveStates[player] or {
    dashing = false,
    lastDash = 0,
    finisherReady = false,
  }

  return self.ActiveStates[player]
end

function CombatRuntime:CanDash(player)
  local state = self:GetState(player)
  return os.clock() - state.lastDash >= self.DashCooldown
end

function CombatRuntime:TriggerDash(player)
  local state = self:GetState(player)
  if not self:CanDash(player) then
    return false
  end

  state.dashing = true
  state.lastDash = os.clock()

  task.delay(0.25, function()
    local latestState = self.ActiveStates[player]
    if latestState then
      latestState.dashing = false
    end
  end)

  return true
end

function CombatRuntime:UpdateFinisher(player, comboCount)
  local state = self:GetState(player)
  state.finisherReady = comboCount >= self.FinisherThreshold
  return state.finisherReady
end

RunService.Heartbeat:Connect(function()
  for player, state in pairs(CombatRuntime.ActiveStates) do
    if not player.Parent then
      CombatRuntime.ActiveStates[player] = nil
    elseif state.finisherReady and os.clock() - state.lastDash > 5 then
      state.finisherReady = false
    end
  end
end)

return CombatRuntime`
  };
}

function createAssistantResponse(prompt, session, preserveExistingCode) {
  const snippet = buildSystemSnippet(prompt);
  const lower = prompt.toLowerCase();
  const isUpdateRequest = preserveExistingCode || lower.includes("keep") || lower.includes("update") || lower.includes("upgrade");

  const beforeCode = session.codeDraft.trim();
  let nextCode;

  if (isUpdateRequest && beforeCode) {
    nextCode = `${beforeCode}

--// TextAI Update: ${snippet.title}
${snippet.code}`;
  } else {
    nextCode = snippet.code;
  }

  const response = [
    `Applied ${isUpdateRequest ? "an update" : "a fresh draft"} for: ${prompt}`,
    isUpdateRequest
      ? "I preserved the existing code in the canvas and appended a new section so the last system is still there."
      : "I replaced the draft with a focused implementation because preserve mode was off or no prior code was available.",
    `Main change: ${snippet.summary}`
  ].join(" ");

  return {
    response,
    nextCode,
    noteTitle: snippet.title,
    noteContent: snippet.summary,
    versionTitle: snippet.title,
    versionSummary: snippet.summary
  };
}

function handlePromptSubmission(event) {
  event.preventDefault();

  const session = getActiveSession();
  const prompt = refs.promptInput.value.trim();
  if (!prompt) {
    return;
  }

  session.codeDraft = refs.codeEditor.value;
  addMessage(session, "user", prompt);
  inferMemoryFromPrompt(prompt, session.memory);
  ensureSessionTitle(session, prompt);

  const result = createAssistantResponse(prompt, session, refs.preserveToggle.checked);

  session.codeDraft = result.nextCode;
  addMessage(session, "assistant", result.response);
  addNote(session, result.noteTitle, result.noteContent);
  saveVersion(session, result.versionTitle, result.versionSummary);
  updateSessionTimestamp(session);
  saveState();
  refs.promptInput.value = "";
  renderApp();
}

function handleSessionSwitch(event) {
  const button = event.target.closest("[data-session-id]");
  if (!button) {
    return;
  }

  const currentSession = getActiveSession();
  currentSession.codeDraft = refs.codeEditor.value;
  state.activeSessionId = button.dataset.sessionId;
  saveState();
  renderApp();
}

function handleVersionRestore(event) {
  const restoreButton = event.target.closest("[data-restore-version]");
  if (!restoreButton) {
    return;
  }

  const session = getActiveSession();
  const version = session.versions.find((item) => item.id === restoreButton.dataset.restoreVersion);
  if (!version) {
    return;
  }

  session.codeDraft = version.code;
  addMessage(session, "assistant", `Restored the code canvas to version: ${version.title}.`);
  addNote(session, "Version restored", `Returned the editor to "${version.title}" so you can keep building from a working snapshot.`);
  updateSessionTimestamp(session);
  saveState();
  renderApp();
}

function handleMemoryInput() {
  const session = getActiveSession();
  session.memory.goal = refs.goalInput.value.trim();
  session.memory.constraints = refs.constraintsInput.value.trim();
  session.memory.systems = refs.systemsInput.value.trim();
  updateSessionTimestamp(session);
  saveState();
  renderStats(session);
  refs.memoryUpdated.textContent = `Updated ${formatRelative(session.updatedAt)}`;
}

function handleEditorInput() {
  const session = getActiveSession();
  session.codeDraft = refs.codeEditor.value;
  updateSessionTimestamp(session);
  saveState();
}

function createNewSession() {
  const session = createSession();
  state.sessions.unshift(session);
  state.activeSessionId = session.id;
  saveState();
  renderApp();
}

function seedStarterCode() {
  const session = getActiveSession();
  session.codeDraft = createDefaultCode();
  addMessage(session, "assistant", "Seeded a fresh Roblox combat starter in the editor while keeping your chat history.");
  addNote(session, "Starter seeded", "Inserted a clean combat starter so you have a stable base for new upgrades.");
  saveVersion(session, "Fresh starter seed", "Re-seeded the base Luau combat starter.");
  updateSessionTimestamp(session);
  saveState();
  renderApp();
}

function saveManualSnapshot() {
  const session = getActiveSession();
  session.codeDraft = refs.codeEditor.value;
  saveVersion(session, "Manual snapshot", "Saved the current editor draft exactly as written.");
  addNote(session, "Snapshot saved", "Stored the current code so you can restore this version later.");
  updateSessionTimestamp(session);
  saveState();
  renderApp();
}

function clearActiveChat() {
  const session = getActiveSession();
  session.messages = [];
  session.notes = [
    {
      id: createId("note"),
      title: "Chat reset",
      content: "The active chat was cleared, but project memory, code, and versions were kept."
    }
  ];
  updateSessionTimestamp(session);
  saveState();
  renderApp();
}

function clearAllStorage() {
  const replacement = createSession("Arena Combat Build");
  state.sessions = [replacement];
  state.activeSessionId = replacement.id;
  saveState();
  renderApp();
}

async function copyCode() {
  const session = getActiveSession();
  session.codeDraft = refs.codeEditor.value;

  try {
    await navigator.clipboard.writeText(session.codeDraft);
    addNote(session, "Copied to clipboard", "The current Luau draft was copied so you can paste it into Roblox Studio.");
  } catch (error) {
    addNote(session, "Clipboard blocked", "Clipboard access failed in this browser, but the code is still in the editor.");
  }

  updateSessionTimestamp(session);
  saveState();
  renderApp();
}

function attachEvents() {
  refs.sessionList.addEventListener("click", handleSessionSwitch);
  refs.versionList.addEventListener("click", handleVersionRestore);
  refs.composerForm.addEventListener("submit", handlePromptSubmission);
  refs.goalInput.addEventListener("input", handleMemoryInput);
  refs.constraintsInput.addEventListener("input", handleMemoryInput);
  refs.systemsInput.addEventListener("input", handleMemoryInput);
  refs.codeEditor.addEventListener("input", handleEditorInput);
  refs.newSessionButton.addEventListener("click", createNewSession);
  refs.seedStarterButton.addEventListener("click", seedStarterCode);
  refs.saveVersionButton.addEventListener("click", saveManualSnapshot);
  refs.clearChatButton.addEventListener("click", clearActiveChat);
  refs.clearStorageButton.addEventListener("click", clearAllStorage);
  refs.copyCodeButton.addEventListener("click", copyCode);
}

function init() {
  renderPresets();
  attachEvents();
  renderApp();
}

init();
