import type { RepoInventory } from "../repo/RepoInventory.js";
import type { ValidationCommand } from "./ValidationReport.js";

function hasFile(inventory: RepoInventory, fileName: string): boolean {
  return inventory.files.some((file) => file.toLowerCase().endsWith(fileName.toLowerCase()));
}

function hasManifest(inventory: RepoInventory, fileName: string): boolean {
  return inventory.manifests.some((manifest) => manifest.toLowerCase().endsWith(fileName.toLowerCase()));
}

function addCommand(commands: ValidationCommand[], command: ValidationCommand): void {
  if (!commands.some((existing) => existing.command === command.command && existing.cwd === command.cwd)) {
    commands.push(command);
  }
}

export function resolveValidationCommands(inventory: RepoInventory, cwd = "."): { commands: ValidationCommand[]; warnings: string[] } {
  const commands: ValidationCommand[] = [];
  const warnings: string[] = [];
  const projectTypes = new Set(inventory.projectTypes);

  for (const command of inventory.buildHints) {
    addCommand(commands, {
      kind: "build",
      command,
      cwd,
      source: "repo-inventory.buildHints",
      required: true
    });
  }

  for (const command of inventory.testHints) {
    addCommand(commands, {
      kind: "test",
      command,
      cwd,
      source: "repo-inventory.testHints",
      required: true
    });
  }

  if (projectTypes.has("node") || projectTypes.has("typescript") || hasManifest(inventory, "package.json")) {
    addCommand(commands, {
      kind: "build",
      command: "npm run build",
      cwd,
      source: "node-default",
      required: true
    });

    addCommand(commands, {
      kind: "test",
      command: "npm test",
      cwd,
      source: "node-default",
      required: true
    });

    addCommand(commands, {
      kind: "typecheck",
      command: "npm run typecheck",
      cwd,
      source: "typescript-default",
      required: projectTypes.has("typescript") || hasManifest(inventory, "tsconfig.json")
    });

    addCommand(commands, {
      kind: "lint",
      command: "npm run lint",
      cwd,
      source: "node-convention",
      required: false
    });
  }

  if (projectTypes.has("python") || hasManifest(inventory, "pyproject.toml") || hasManifest(inventory, "requirements.txt")) {
    addCommand(commands, {
      kind: "test",
      command: "pytest",
      cwd,
      source: "python-default",
      required: hasFile(inventory, ".py") || hasFile(inventory, "pytest.ini")
    });

    if (hasManifest(inventory, "pyproject.toml")) {
      addCommand(commands, {
        kind: "typecheck",
        command: "mypy .",
        cwd,
        source: "python-pyproject-convention",
        required: false
      });

      addCommand(commands, {
        kind: "lint",
        command: "ruff check .",
        cwd,
        source: "python-pyproject-convention",
        required: false
      });
    }
  }

  if (projectTypes.has("powershell") || inventory.files.some((file) => /\.(ps1|psm1|psd1)$/i.test(file))) {
    addCommand(commands, {
      kind: "test",
      command: "Invoke-Pester",
      cwd,
      source: "powershell-convention",
      required: inventory.files.some((file) => /tests?.*\.(ps1|psm1)$/i.test(file))
    });
  }

  const requiredCommands = commands.filter((command) => command.required);

  if (commands.length === 0) {
    warnings.push("No validation commands could be resolved from repository inventory.");
  }

  if (requiredCommands.length === 0) {
    warnings.push("No required validation commands were resolved. Christina should treat this sprint as blocked until validation is defined.");
  }

  return {
    commands: commands.sort((a, b) => `${a.kind}:${a.command}`.localeCompare(`${b.kind}:${b.command}`)),
    warnings
  };
}
