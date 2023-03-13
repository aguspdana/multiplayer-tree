"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.docs = void 0;
const doc_1 = require("doc");
exports.docs = [
    {
        id: "page-1",
        type: doc_1.DocType.Page,
        title: "Example",
        children: [
            {
                id: "layout-1",
                type: doc_1.ElementType.Layout,
                name: "Layout 1",
                direction: doc_1.LayoutDirection.Row,
                children: [
                    {
                        id: "text-1",
                        type: doc_1.ElementType.Text,
                        name: "Text 1",
                        text: "Hello Text 1",
                        fontSize: 16
                    },
                    {
                        id: "text-2",
                        type: doc_1.ElementType.Text,
                        name: "Text 2",
                        text: "Hello Text 2",
                        fontSize: 16
                    },
                    {
                        id: "text-3",
                        type: doc_1.ElementType.Text,
                        name: "Text 3",
                        text: "Hello Text 3",
                        fontSize: 16
                    }
                ]
            },
            {
                id: "layout-2",
                type: doc_1.ElementType.Layout,
                name: "Layout 2",
                direction: doc_1.LayoutDirection.Column,
                children: [
                    {
                        id: "text-4",
                        type: doc_1.ElementType.Text,
                        name: "Text 4",
                        text: "Hello Text 4",
                        fontSize: 16
                    },
                    {
                        id: "text-5",
                        type: doc_1.ElementType.Text,
                        name: "Text 5",
                        text: "Hello Text 5",
                        fontSize: 16
                    },
                    {
                        id: "text-6",
                        type: doc_1.ElementType.Text,
                        name: "Text 6",
                        text: "Hello Text 6",
                        fontSize: 16
                    }
                ]
            },
            {
                id: "comp-ref-1",
                type: doc_1.ElementType.ComponentRef,
                name: "Login form",
                docId: "comp-1",
            },
        ]
    },
    {
        type: doc_1.DocType.Component,
        id: "comp-1",
        title: "Login form",
        children: [
            {
                type: doc_1.ElementType.Input,
                id: "comp1-input-1",
                name: "Input.Email",
                placeholder: "Email",
            },
            {
                type: doc_1.ElementType.Input,
                id: "comp-1-input-1",
                name: "Input.Password",
                placeholder: "Password",
            },
            {
                type: doc_1.ElementType.Button,
                id: "comp-1-input-2",
                name: "Button.Login",
                text: "Login",
            },
        ],
    },
];
