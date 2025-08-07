import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';

(async () => {
	const spinner = ora();

	try {
		// Пути к файлам package.json
		const rootPackagePath = './package.json';
		const packagePackagePath = './package/package.json';

		// Читаем package.json из корня и package/
		const rootPkg = JSON.parse(fs.readFileSync(rootPackagePath, 'utf-8'));
		const pkg = JSON.parse(fs.readFileSync(packagePackagePath, 'utf-8'));

		// Получаем новую версию
		let newVersion = process.argv[2];
		if (!newVersion) {
			const { version } = await inquirer.prompt([
				{
					type: 'input',
					name: 'version',
					message: `Введите новую версию (текущая версия ${pkg.version}):`,
					default: pkg.version,
				},
			]);
			newVersion = version;
		}

		// Обновляем версию в package/package.json
		if (newVersion) {
			pkg.version = newVersion;
			fs.writeFileSync(packagePackagePath, JSON.stringify(pkg, null, '\t'));
			console.log(chalk.green(`\nВерсия обновлена до ${pkg.version}\n`));
		}

		// Сборка проекта
		console.log(chalk.blue('Сборка проекта...'));
		execSync('npm run build', { stdio: 'inherit' });

		// Пути к директориям
		const distPath = path.resolve('./dist');
		const packagePath = path.resolve('./package');

		// Копирование файлов из dist/ в package/
		console.log(chalk.blue('\nКопирование файлов из dist/ в package/...'));
		const copiedItems = [];

		function copyRecursiveSync(src, dest) {
			const stats = fs.statSync(src);
			if (stats.isDirectory()) {
				if (!fs.existsSync(dest)) {
					fs.mkdirSync(dest);
				}
				const items = fs.readdirSync(src);
				items.forEach(item => {
					copyRecursiveSync(path.join(src, item), path.join(dest, item));
				});
			} else {
				fs.copyFileSync(src, dest);
			}
			copiedItems.push(dest);
		}

		const distItems = fs.readdirSync(distPath);
		distItems.forEach(item => {
			const srcPath = path.join(distPath, item);
			const destPath = path.join(packagePath, item);
			copyRecursiveSync(srcPath, destPath);
		});

		console.log(chalk.green('\nСкопированные файлы и директории:'));
		copiedItems.forEach(item => {
			console.log(chalk.yellow(` - ${item}`));
		});

		// Динамически собираем список файлов для секции files
		const packageFiles = fs.readdirSync(packagePath).filter(file => {
			// Исключаем package.json, README.md, LICENSE и другие ненужные файлы
			return !['package.json', 'README.md', 'LICENSE'].includes(file);
		});

		// Обновляем package.json в package/ с динамической секцией files
		pkg.files = packageFiles;
		fs.writeFileSync(packagePackagePath, JSON.stringify(pkg, null, '\t'));

		// Сохраняем список скопированных элементов для последующей очистки
		fs.writeFileSync('./copiedItems.json', JSON.stringify(copiedItems, null, '\t'));

		// Запрос подтверждения на публикацию
		const { publish } = await inquirer.prompt([
			{
				type: 'confirm',
				name: 'publish',
				message: 'Опубликовать пакет на npm?',
				default: true,
			},
		]);

		if (publish) {
			// Публикация на npm
			console.log(chalk.blue('\nПубликация на npm...'));
			spinner.start('Публикация...');
			execSync('npm publish', { stdio: 'inherit', cwd: './package' });
			spinner.succeed('Пакет опубликован на npm!');

			// Синхронизация версии в корневом package.json
			rootPkg.version = pkg.version;
			fs.writeFileSync(rootPackagePath, JSON.stringify(rootPkg, null, '\t'));
			console.log(`Синхронизирована версия пакета: ${pkg.version}`);
		} else {
			// Создание пакета с помощью npm pack
			console.log(chalk.blue('\nСоздание пакета (npm pack)...'));
			spinner.start('Упаковка...');
			execSync('npm pack', { stdio: 'inherit', cwd: './package' });
			spinner.succeed('Пакет создан в виде архива.');
		}

		console.log(chalk.green('\nВыпуск успешно завершен!\n'));
	} catch (error) {
		console.error(chalk.red('Произошла ошибка:'), error);
	} finally {
		// Очистка временных файлов
		spinner.start('Удаление временных файлов...');
		const itemsToRemove = JSON.parse(fs.readFileSync('./copiedItems.json', 'utf-8'));

		itemsToRemove.forEach(item => {
			if (fs.existsSync(item)) {
				const stats = fs.statSync(item);
				if (stats.isDirectory()) {
					fs.rmSync(item, { recursive: true, force: true });
				} else {
					fs.unlinkSync(item);
				}
			}
		});
		fs.unlinkSync('./copiedItems.json');
		spinner.succeed('Удалены временные файлы!');
	}

	// Запрос подтверждения на создание коммита и пуш в ветку
	const { commit_and_push } = await inquirer.prompt([
		{
			type: 'confirm',
			name: 'commit_and_push',
			message: 'Закомитить и запушить package.json`ы?',
			default: true,
		},
	]);

	if (commit_and_push) {
		execSync(`git add ${rootPackagePath} ${packagePackagePath}`, { stdio: 'inherit', cwd: '.' });
		spinner.succeed(`Добавлены файлы ${rootPackagePath} и ${packagePackagePath}`);
		execSync(`git commit -m 'update: Обновлены верcии пакетов.' && git push`, { stdio: 'inherit', cwd: '.' });
		spinner.succeed('Коммит отправлен в удаленный репозиторий!');
	}

	process.exit(0);
})();
