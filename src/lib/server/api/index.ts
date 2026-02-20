import { Container } from '@needle-di/core';
import { ApplicationModule } from './application.module';
import { ApplicationController } from './application.controller';

const container = new Container();

function getApplicationController() {
	return container.get(ApplicationController);
}

function getApplicationModule() {
	return container.get(ApplicationModule);
}

/* ------------------------------ startServer ------------------------------ */
export function startServer() {
	return getApplicationModule().start();
}

/* ----------------------------------- api ---------------------------------- */
export function getRoutes() {
	return getApplicationController().registerControllers();
}

/* ---------------------------------- Types --------------------------------- */
export type ApiRoutes = ReturnType<typeof getRoutes>;
