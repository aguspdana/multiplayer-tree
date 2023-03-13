"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schema = void 0;
const uuid_1 = require("uuid");
const id = {
    path: "id",
    cardinality: "ONE",
    contentType: "ID",
    default: {
        type: "function",
        value: () => (0, uuid_1.v4)()
    },
    validations: {
        required: true,
        unique: true
    },
    rights: ["CREATE", "DELETE", "UPDATE"],
};
exports.schema = {
    entities: {
        Doc: {
            idFields: ["id"],
            defaultDBConnector: {
                id: "default"
            },
            dataFields: [
                { ...id },
                {
                    path: "title",
                    cardinality: "ONE",
                    contentType: "TEXT",
                    validations: {
                        required: true
                    },
                    rights: ["CREATE", "DELETE", "UPDATE"],
                },
            ],
            linkFields: [
                {
                    path: "children",
                    relation: "Doc-Child",
                    cardinality: "MANY",
                    plays: "doc",
                    target: "relation",
                },
            ],
        },
        PageDoc: {
            extends: "Doc",
            defaultDBConnector: {
                id: "default"
            },
            linkFields: [
                {
                    path: "referrers",
                    relation: "Element-PageRef",
                    cardinality: "MANY",
                    plays: "page",
                    target: "relation",
                },
            ],
        },
        ComponentDoc: {
            extends: "Doc",
            defaultDBConnector: {
                id: "default"
            },
            linkFields: [
                {
                    path: "referrers",
                    relation: "Element-ComponentRef",
                    cardinality: "MANY",
                    plays: "component",
                    target: "relation",
                },
            ],
        },
        Child: {
            idFields: ["id"],
            defaultDBConnector: {
                id: "default"
            },
            dataFields: [
                { ...id },
            ],
            linkFields: [
                {
                    path: "doc",
                    relation: "Doc-Child",
                    cardinality: "ONE",
                    plays: "child",
                    target: "relation",
                },
                {
                    path: "parent",
                    relation: "Parent-Child",
                    cardinality: "ONE",
                    plays: "child",
                    target: "relation",
                },
            ],
        },
        Parent: {
            extends: "Child",
            defaultDBConnector: {
                id: "default",
            },
            linkFields: [
                {
                    path: "children",
                    relation: "Parent-Child",
                    cardinality: "MANY",
                    plays: "parent",
                    target: "relation",
                },
            ],
        },
        LayoutElement: {
            extends: "Parent",
            defaultDBConnector: {
                id: "default",
            },
            dataFields: [
                {
                    path: "direction",
                    cardinality: "ONE",
                    contentType: "TEXT",
                    validations: {
                        required: true
                    },
                    rights: ["CREATE", "DELETE", "UPDATE"],
                }
            ],
        },
        TextElement: {
            extends: "Child",
            defaultDBConnector: {
                id: "default",
            },
            dataFields: [
                {
                    path: "text",
                    cardinality: "ONE",
                    contentType: "TEXT",
                    validations: {
                        required: true
                    },
                    rights: ["CREATE", "DELETE", "UPDATE"],
                }
            ],
        },
        InputElement: {
            extends: "Child",
            defaultDBConnector: {
                id: "default",
            },
            dataFields: [
                {
                    path: "name",
                    cardinality: "ONE",
                    contentType: "TEXT",
                    validations: {
                        required: true
                    },
                    rights: ["CREATE", "DELETE", "UPDATE"],
                }
            ],
        },
        ButtonElement: {
            extends: "Child",
            defaultDBConnector: {
                id: "default",
            },
            dataFields: [
                {
                    path: "text",
                    cardinality: "ONE",
                    contentType: "TEXT",
                    validations: {
                        required: true
                    },
                    rights: ["CREATE", "DELETE", "UPDATE"],
                }
            ],
        },
        PageRefElement: {
            extends: "Child",
            defaultDBConnector: {
                id: "default",
            },
            linkFields: [
                {
                    path: "page",
                    relation: "Element-PageRef",
                    cardinality: "ONE",
                    plays: "element",
                    target: "relation",
                }
            ],
        },
        ComponentRefElement: {
            extends: "Child",
            defaultDBConnector: {
                id: "default",
            },
            linkFields: [
                {
                    path: "component",
                    relation: "Element-ComponentRef",
                    cardinality: "ONE",
                    plays: "element",
                    target: "relation",
                }
            ],
        },
    },
    relations: {
        "Doc-Child": {
            idFields: ["id"],
            defaultDBConnector: {
                id: "default",
                path: "Doc-Child"
            },
            dataFields: [{ ...id }],
            roles: {
                doc: {
                    cardinality: "ONE",
                },
                child: {
                    cardinality: "ONE",
                },
            },
        },
        "Parent-Child": {
            idFields: ["id"],
            defaultDBConnector: {
                id: "default",
                path: "Parent-Child"
            },
            dataFields: [{ ...id }],
            roles: {
                parent: {
                    cardinality: "ONE",
                },
                child: {
                    cardinality: "ONE",
                },
            },
        },
        "Element-PageRef": {
            idFields: ["id"],
            defaultDBConnector: {
                id: "default",
                path: "Element-PageRef"
            },
            dataFields: [{ ...id }],
            roles: {
                element: {
                    cardinality: "ONE",
                },
                page: {
                    cardinality: "ONE",
                },
            },
        },
        "Element-ComponentRef": {
            idFields: ["id"],
            defaultDBConnector: {
                id: "default",
                path: "Element-ComponentRef"
            },
            dataFields: [{ ...id }],
            roles: {
                element: {
                    cardinality: "ONE",
                },
                component: {
                    cardinality: "ONE",
                },
            },
        },
    },
};
