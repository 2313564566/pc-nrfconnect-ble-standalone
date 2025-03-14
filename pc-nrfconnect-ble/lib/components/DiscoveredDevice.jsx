/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

'use strict';

import React from 'react';
import Button from 'react-bootstrap/Button';
import { camelCase, pascalCase } from 'change-case';
import PropTypes from 'prop-types';

import { ImmutableDevice } from '../utils/api';
import { toHexString } from '../utils/stringUtil';
import { getUuidName } from '../utils/uuid_definitions';

const RssiBars = ({ rssi }) => {
    let bars = 0;
    if (rssi < -100) {
        bars = 1;
    } else if (rssi < -80) {
        bars = 2;
    } else if (rssi < -60) {
        bars = 3;
    } else if (rssi < -45) {
        bars = 4;
    } else {
        bars = 5;
    }
    const fill = Array(5)
        .fill(0)
        .map((v, i) => (i < bars ? 'black' : 'lightgray'));
    return (
        <svg viewBox="0 0 14 16" width="14" className="rssi-bars">
            <rect x="0" y="14" width="2" height="2" fill={fill[0]} />
            <rect x="3" y="13" width="2" height="3" fill={fill[1]} />
            <rect x="6" y="11" width="2" height="5" fill={fill[2]} />
            <rect x="9" y="8" width="2" height="8" fill={fill[3]} />
            <rect x="12" y="4" width="2" height="12" fill={fill[4]} />
        </svg>
    );
};

RssiBars.propTypes = {
    rssi: PropTypes.number.isRequired,
};

function getAdvTypeText(advType) {
    if (!advType) {
        return undefined;
    }

    if (advType.includes('ADV_IND')) {
        return 'Connectable undirected';
    }
    if (advType.includes('ADV_DIRECT')) {
        return 'Connectable directed';
    }
    if (advType.includes('ADV_SCAN')) {
        return 'Scannable undirected';
    }
    if (advType.includes('NONCONN_IND')) {
        return 'Non connectable undirected';
    }

    return undefined;
}

function rewriter(value) {
    const rewriteRules = [
        {
            expr: /BLE_GAP_AD_TYPE_(.*)/,
            on_match: function onMatch(matches) {
                return pascalCase(matches[1]);
            },
        },
        {
            expr: /BLE_GAP_ADDR_TYPE_(.*)/,
            on_match: function onMatch(matches) {
                return pascalCase(matches[1]);
            },
        },
    ];

    try {
        for (let i = 0; i < rewriteRules.length; i += 1) {
            const rule = rewriteRules[i];
            if (rule.expr.test(value)) {
                return rule.on_match(rule.expr.exec(value));
            }
        }
    } catch (err) {
        // Log to console.log because we may not have a valid logger if we get here.
        console.log(err);
    }

    // We did not find any rules to rewrite the value, return original value
    return camelCase(value);
}

class DiscoveredDevice extends React.PureComponent {
    constructor(props) {
        super(props);

        this.currentAdvType = undefined;
        this.currentFlags = undefined;
        this.currentServices = undefined;

        this.toggleExpand = this.toggleExpand.bind(this);
        this.onButtonClick = this.onButtonClick.bind(this);
    }

    onButtonClick(e) {
        const { device, onCancelConnect, onConnect, adapterIsConnecting } =
            this.props;

        e.stopPropagation();

        if (adapterIsConnecting) {
            onCancelConnect(device);
        } else {
            onConnect(device);
        }
    }

    toggleExpand() {
        const { device, onToggleExpanded } = this.props;
        onToggleExpanded(device.address);
    }

    render() {
        const { device, isConnecting, adapterIsConnecting } = this.props;

        let adDataDiv = '';
        let advTypeDiv = '';
        let flagsDiv = '';
        let servicesDiv = '';
        let addressDiv = '';
        let addressTypeDiv = '';

        if (device.isExpanded) {
            if (device.advType) {
                this.currentAdvType = device.advType;
            }

            if (device.flags && device.flags.size > 0) {
                this.currentFlags = device.flags;
            }

            if (device.services && device.services.size > 0) {
                this.currentServices = device.services;
            }

            adDataDiv = (
                <div>
                    {device.adData
                        .filterNot(
                            (value, key) =>
                                key.includes('BIT_SERVICE') ||
                                key.includes('_FLAGS') ||
                                key.includes('LOCAL_NAME')
                        )
                        .map((value, key) => {
                            const key1 = `${key}_1`;
                            return (
                                <div key={key1} className="adv-line selectable">
                                    <span className="adv-label">
                                        {rewriter(key)}:
                                    </span>
                                    <span className="adv-value">
                                        {toHexString(value)}
                                    </span>
                                </div>
                            );
                        })
                        .values()}
                </div>
            );

            advTypeDiv = this.currentAdvType ? (
                <div className="adv-line selectable">
                    <span className="adv-label">Advertising type:</span>
                    <span className="adv-value">
                        {getAdvTypeText(this.currentAdvType)}
                    </span>
                </div>
            ) : null;

            addressTypeDiv = (
                <div className="adv-line selectable">
                    <span className="adv-label">Address type:</span>
                    <span className="adv-value">
                        {rewriter(device.addressType)}
                    </span>
                </div>
            );

            flagsDiv =
                this.currentFlags && this.currentFlags.size > 0 ? (
                    <div className="adv-line selectable">
                        <span className="adv-label">Flags:</span>
                        {this.currentFlags.map((flag, index) => {
                            const key = `${index}_3`;
                            return (
                                <span key={key} className="adv-value">
                                    {flag}
                                </span>
                            );
                        })}
                    </div>
                ) : null;

            servicesDiv =
                this.currentServices && this.currentServices.size > 0 ? (
                    <div className="adv-line selectable">
                        <span className="adv-label">Services:</span>
                        {device.services.map((service, index) => {
                            const key = `${index}_4`;
                            return (
                                <span key={key} className="adv-value">
                                    {getUuidName(service)}
                                </span>
                            );
                        })}
                    </div>
                ) : null;
        }

        addressDiv = (
            <div className="address-text selectable">{device.address}</div>
        );

        const dirIcon = device.isExpanded ? 'menu-down' : 'menu-right';

        if (!device) {
            return (
                <div>
                    <h3 style={{ textAlign: 'center' }}>Local dongle</h3>
                </div>
            );
        }

        return (
            <div className="device">
                <div className="top-bar">
                    <div style={{ float: 'right' }}>
                        <span className="address-text">{`${device.rssi} dBm`}</span>
                        <RssiBars rssi={device.rssi} />
                    </div>
                    <div className="device-name selectable">
                        {device.name || '<Unknown name>'}
                    </div>
                </div>
                <div className="top-bar">
                    <div>
                        <span className="address-text">{`平均: ${(device.allRssi.reduce((a, b) => a + b, 0) / device.allRssi.size).toFixed(2)} dBm`}</span>
                    </div>
                    <div>
                        <span className="address-text">{`最大: ${device.allRssi.max()} dBm`}</span>
                    </div>
                    <div>
                        <span className="address-text">{`最小: ${device.allRssi.min()} dBm`}</span>
                    </div>
                </div>
                <div className="discovered-device-body text-small">
                    <div className="discovered-device-address-line">
                        <Button
                            type="button"
                            onClick={this.onButtonClick}
                            className="btn btn-primary btn-xs btn-nordic"
                            disabled={
                                (!isConnecting && adapterIsConnecting) ||
                                device.connected
                            }
                            size="sm"
                        >
                            <span>{isConnecting ? 'Cancel' : 'Connect'}</span>
                            <i className="mdi mdi-link-variant" />
                        </Button>
                        {addressDiv}
                    </div>
                    <div>
                        <span
                            className="adv-details"
                            onClick={this.toggleExpand}
                            onKeyDown={() => {}}
                            role="button"
                            tabIndex={0}
                        >
                            <i className={`mdi mdi-${dirIcon}`} />
                            Details
                        </span>
                        {addressTypeDiv}
                        {advTypeDiv}
                        {servicesDiv}
                        {flagsDiv}
                        {adDataDiv}
                    </div>
                </div>
            </div>
        );
    }
}

DiscoveredDevice.propTypes = {
    device: PropTypes.instanceOf(ImmutableDevice).isRequired,
    // If adapter is currently connecting to a device
    adapterIsConnecting: PropTypes.bool.isRequired,
    // If adapter is currently connecting to this device
    isConnecting: PropTypes.bool.isRequired,
    onConnect: PropTypes.func.isRequired,
    onCancelConnect: PropTypes.func.isRequired,
    onToggleExpanded: PropTypes.func.isRequired,
};

export default DiscoveredDevice;
