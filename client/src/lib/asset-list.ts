import AssetLoader from '../game/assets/AssetLoader';

export const assetList = {
    lobbyMap: AssetLoader.createGLTF('/objects/lobby_map.glb'),
    lobbyNavmesh: AssetLoader.createGLTF('/objects/lobby_navmesh.gltf'),
    yBot: AssetLoader.createFBX('/objects/y_bot.fbx'),
    yBot_aIdle: AssetLoader.createFBX('/animations/y_bot_idle.fbx'),
    yBot_aRun: AssetLoader.createFBX('/animations/y_bot_run.fbx')
};
