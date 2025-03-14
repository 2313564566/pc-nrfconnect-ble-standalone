/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

'use strict';

import { List, Map, OrderedMap, Record } from 'immutable';

const ImmutableAdapterState = Record({
    instanceId: null,
    port: null,
    serialNumber: null,
    available: false,
    scanning: false,
    advertising: false,
    connecting: false,
    address: null,
    name: null,
    firmwareVerison: null,
});

export const ImmutableAdapter = Record({
    state: new ImmutableAdapterState(),
    connectedDevices: Map(),
    /* Adapter sub-reducers */
    deviceDetails: undefined,
    serverSetup: undefined,
    security: undefined,
    isServerSetupApplied: false,
});

export const ImmutableDevice = Record({
    instanceId: null,
    isConnecting: false, // Used by UI to determine visualize we are connecting
    connected: false,
    address: null,
    addressType: null,
    advType: null,
    flags: List(),
    adData: OrderedMap(),
    name: null,
    role: null,
    minConnectionInterval: null,
    maxConnectionInterval: null,
    slaveLatency: null,
    connectionSupervisionTimeout: null,
    services: List(),
    rssi: null,
    allRssi: List(),
    scanResponse: false,
    bonded: false,
    securityMode: null,
    securityLevel: null,
    isExpanded: false,
    ownPeriphInitiatedPairingPending: false,
    rxPhy: null,
    txPhy: null,
    mtu: null,
    dataLength: null,
});

const ImmutableProperties = Record({
    broadcast: false,
    read: false,
    writeWoResp: false,
    write: false,
    notify: false,
    indicate: false,
    authSignedWr: false,
    reliableWr: false,
    wrAux: false,
});

export const ImmutableService = Record({
    instanceId: null,
    deviceInstanceId: null,
    uuid: null,
    name: null,
    handle: null,
    expanded: false,
    discoveringChildren: false,
    children: null,
});

export const ImmutableCharacteristic = Record({
    instanceId: null,
    serviceInstanceId: null,
    uuid: null,
    name: null,
    declarationHandle: null,
    valueHandle: null,
    value: List(),
    properties: new ImmutableProperties(),
    readPerm: null,
    writePerm: null,
    fixedLength: false,
    maxLength: null,
    expanded: false,
    discoveringChildren: false,
    children: null,
    errorMessage: null,
});

export const ImmutableDescriptor = Record({
    instanceId: null,
    characteristicInstanceId: null,
    uuid: null,
    name: null,
    handle: null,
    value: List(),
    readPerm: null,
    writePerm: null,
    fixedLength: false,
    maxLength: null,
    errorMessage: null,
});

export function getInstanceIds(instanceId) {
    const instanceIds = {
        address: null,
        device: null,
        service: null,
        characteristic: null,
        descriptor: null,
    };

    if (!instanceId) {
        return instanceIds;
    }

    const idArray = instanceId.split('.');

    if (idArray.length > 0) {
        [instanceIds.address] = idArray;
    }

    if (idArray.length > 1) {
        instanceIds.device = idArray.slice(0, 2).join('.');
    }

    if (idArray.length > 2) {
        instanceIds.service = idArray.slice(0, 3).join('.');
    }

    if (idArray.length > 3) {
        instanceIds.characteristic = idArray.slice(0, 4).join('.');
    }

    if (idArray.length > 4) {
        instanceIds.descriptor = idArray.slice(0, 5).join('.');
    }

    return instanceIds;
}

export function getImmutableAdapterState(adapterState) {
    return new ImmutableAdapterState({
        instanceId: adapterState.instanceId,
        port: adapterState.port,
        serialNumber: adapterState.serialNumber,
        available: adapterState.available,
        scanning: adapterState.scanning,
        advertising: adapterState.advertising,
        connecting: adapterState.connecting,
        address: adapterState.address,
        name: adapterState.name,
        firmwareVerison: adapterState.firmwareVerison,
    });
}

export function getImmutableAdapter(adapter) {
    return new ImmutableAdapter({
        port: adapter.state.port,
        state: getImmutableAdapterState(adapter.state),
        connectedDevices: Map(),
        /* Adapter sub-reducers */
        deviceDetails: undefined,
        serverSetup: undefined,
        security: undefined,
    });
}

export function getImmutableDevice(device) {
    return new ImmutableDevice({
        instanceId: device.instanceId,
        connected: device.connected,
        address: device.address,
        addressType: device.addressType,
        name: device.name,
        advType: device.advType,
        adData: Map(device.adData),
        flags: List(device.flags),
        role: device.role,
        minConnectionInterval: device.minConnectionInterval,
        maxConnectionInterval: device.maxConnectionInterval,
        slaveLatency: device.slaveLatency,
        connectionSupervisionTimeout: device.connectionSupervisionTimeout,
        services: List(device.services),
        allRssi: List(),
        rssi: device.rssi,
        scanResponse: device.scanResponse,
        ownPeriphInitiatedPairingPending:
            device.ownPeriphInitiatedPairingPending,
        rxPhy: device.rxPhy,
        txPhy: device.txPhy,
        mtu: device.mtu,
        dataLength: device.dataLength,
    });
}

export function getImmutableProperties(properties) {
    return new ImmutableProperties({
        broadcast: properties.broadcast,
        read: properties.read,
        writeWoResp: properties.writeWoResp || properties.write_wo_resp,
        write: properties.write,
        notify: properties.notify,
        indicate: properties.indicate,
        authSignedWr: properties.authSignedWr || properties.auth_signed_wr,
        reliableWr: properties.reliableWr || properties.reliable_wr,
        wrAux: properties.wrAux ? properties.wrAux : properties.wr_aux,
    });
}

export function getImmutableService(service) {
    return new ImmutableService({
        instanceId: service.instanceId,
        deviceInstanceId: service.deviceInstanceId,
        uuid: service.uuid,
        name: service.name,
        handle: service.startHandle,
        children: service.children,
    });
}

export function getImmutableCharacteristic(characteristic) {
    const properties = characteristic.properties || {};
    return new ImmutableCharacteristic({
        instanceId: characteristic.instanceId,
        serviceInstanceId: characteristic.serviceInstanceId,
        uuid: characteristic.uuid,
        name: characteristic.name,
        declarationHandle: characteristic.declarationHandle,
        valueHandle: characteristic.valueHandle,
        value: List(characteristic.value),
        properties: getImmutableProperties(properties),
        readPerm: characteristic.readPerm,
        writePerm: characteristic.writePerm,
        fixedLength: characteristic.fixedLength,
        maxLength: characteristic.maxLength,
        children: characteristic.children,
    });
}

function getImmutableDescriptorValue(descriptor) {
    const { uuid, value } = descriptor;

    const descriptorInstanceIds = getInstanceIds(descriptor.instanceId);

    if (descriptorInstanceIds.device === 'local.server' && uuid === '2902') {
        let cccdValue = new Map();
        const keys = Object.keys(value);
        for (let i = 0; i < keys.length; i += 1) {
            const deviceInstanceId = keys[i];
            cccdValue = cccdValue.set(
                deviceInstanceId,
                List(value[deviceInstanceId])
            );
        }

        return cccdValue;
    }

    return List(value);
}

export function getImmutableDescriptor(descriptor) {
    const value = getImmutableDescriptorValue(descriptor);
    return new ImmutableDescriptor({
        instanceId: descriptor.instanceId,
        characteristicInstanceId: descriptor.characteristicInstanceId,
        uuid: descriptor.uuid,
        name: descriptor.name,
        handle: descriptor.handle,
        value,
        readPerm: descriptor.readPerm,
        writePerm: descriptor.writePerm,
        fixedLength: descriptor.fixedLength,
        maxLength: descriptor.maxLength,
    });
}
