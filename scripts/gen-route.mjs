import fs from 'fs/promises';
import path from 'path';

const routeName = process.argv[2];

if (!routeName) {
  console.error('Please provide a route name. Example: pnpm gen setting');
  process.exit(1);
}

// Convert kebab-case to PascalCase for component/type names
const toPascalCase = (str) => {
  return str
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
};

const pascalName = toPascalCase(routeName);
const targetDir = path.resolve('app', routeName);

const folders = [
  '_components',
  '_constants',
  '_types',
  '_utils',
  '_hooks',
  '_schemas',
];

async function generate() {
  try {
    // Check if directory already exists
    try {
      await fs.access(targetDir);
      console.error(`❌ Error: Directory "app/${routeName}" already exists.`);
      process.exit(1);
    } catch {
      // Continue if directory doesn't exist
    }

    // Create target directory
    await fs.mkdir(targetDir, { recursive: true });

    // Create subfolders
    for (const folder of folders) {
      const folderPath = path.join(targetDir, folder);
      await fs.mkdir(folderPath, { recursive: true });
      // Add .gitkeep to ensure empty folders are tracked if needed
      await fs.writeFile(path.join(folderPath, '.gitkeep'), '');
    }

    // 1. Create page.tsx
    const pageContent = `const ${pascalName}Page = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold">${pascalName} Page</h1>
    </div>
  );
};

export default ${pascalName}Page;
`;
    await fs.writeFile(path.join(targetDir, 'page.tsx'), pageContent);

    // 2. Create _store.ts (Zustand Store)
    const storeContent = `import { create } from 'zustand';

type ${pascalName}State = {
  // TODO: Define state properties
};

type ${pascalName}Action = {
  // TODO: Define actions
};

export const use${pascalName}Store = create<${pascalName}State & ${pascalName}Action>((set) => ({
  // TODO: Initialize state and actions
}));
`;
    await fs.writeFile(path.join(targetDir, '_store.ts'), storeContent);

    // 3. Create _types/<name>.type.ts
    // Rule: All file name is in kebab-case with prefix is the folder name
    const typeFileName = `${routeName}.type.ts`;
    const typeContent = `export type ${pascalName} = {
  // TODO: Define ${pascalName} type properties
};
`;
    await fs.writeFile(
      path.join(targetDir, '_types', typeFileName),
      typeContent,
    );

    console.log(`\n✅ Route "app/${routeName}" generated successfully!`);
    console.log(`\nFiles created:`);
    console.log(`  - app/${routeName}/page.tsx`);
    console.log(`  - app/${routeName}/_store.ts`);
    console.log(`  - app/${routeName}/_types/${typeFileName}`);
    console.log(`\nFolders created (with .gitkeep):`);
    console.log(
      `  - ${folders.map((f) => `app/${routeName}/${f}`).join('\n  - ')}`,
    );
  } catch (error) {
    console.error('❌ Error generating route:', error);
    process.exit(1);
  }
}

generate();
