workspace "ValueObjects Node.js implementation" {

    model {

        bigNumber = softwareSystem "bignumber.js" "Third party library for arbitrary-precision decimal and non-decimal arithmetic" {
            tags "external"
        }

        nodeJsApp = softwareSystem "Node.js Application" "Reference implementation of the DDD Value Object pattern, built as teaching material." {
            tags "node-js"

            demoRunner = container "Console Demo" "Runs every value object in turn and prints what each one guarantees." {
                tags "demo"
            }

            domainLayer = container "Domain Layer" "The value objects themselves: self-validating, immutable, compared by value." {
                tags "domain"

                valueObject = component "Value Object" "Abstract base class: immutability, and equality by declared components rather than by identity." {
                    tags "abstract"
                }

                emailVO = component "Email" "Email address, normalised to lowercase and trimmed, so addresses differing only in case are one value." {
                    tags "value-object" "email"
                }

                moneyVO = component "Money" "An Amount denominated in a Currency, rounded half up to that currency's decimal places at construction." {
                    tags "value-object" "money"
                }

                amountVO = component "Amount" "An exact decimal quantity, with no currency attached. May be negative." {
                    tags "value-object" "amount"
                }

                currencyVO = component "Currency" "A supported denomination from a closed set, carrying the ISO code and the decimal places its amounts are expressed in." {
                    tags "value-object" "currency"
                }

                priceVO = component "Price" "Money constrained to non-negative: what something costs." {
                    tags "value-object" "price"
                }

                currencyCodes = component "Currency Codes" "The closed set of supported ISO codes and the decimal places each one is expressed in." {
                    tags "types"
                }
            }
        }

        emailVO -> valueObject "inherits from"
        moneyVO -> valueObject "inherits from"
        currencyVO -> valueObject "inherits from"
        amountVO -> valueObject "inherits from"
        priceVO -> valueObject "inherits from"

        // Money builds the Amounts it holds (Amount.create, amount.round); it never
        // builds a Currency, which arrives already interned. Price never builds a
        // Money either. The labels keep that difference, because it is the one that
        // explains why Currency.All exists and Amount has no equivalent.
        moneyVO -> amountVO "builds and holds"
        moneyVO -> currencyVO "holds, and takes its scale from"

        priceVO -> moneyVO "refines, adding non-negativity"

        currencyVO -> currencyCodes "reads the supported set and its scales"
        moneyVO -> currencyCodes "names the code on the wire form"

        amountVO -> bigNumber "delegates decimal arithmetic to, and keeps out of its public API" {
            tags "external-dependency"
        }

        demoRunner -> domainLayer "exercises"
    }

    views {

        properties {
            "structurizr.locale" "en-US"
        }

        container nodeJsApp "Application-Containers"{
            include *

            autolayout lr

        }

        component domainLayer "Domain-Layer-Overview"{
            include *
            // Kept out on purpose: as an element outside both boundaries, autolayout
            // places it where the software system boundary is later drawn over it.
            // The dependency is shown in full in the Amount-Value-Object view.
            exclude bigNumber
            // Explicit parameters: a bare `autolayout` lets stale values cached in
            // workspace.json win, and tight separation is what lets the boundary
            // crowd its neighbours.
            autolayout lr 300 300

        }

        component domainLayer "Email-Value-Object"{
            include valueObject
            include emailVO

            autolayout lr

        }

        component domainLayer "Amount-Value-Object"{
            include valueObject
            include amountVO
            include bigNumber

            autolayout lr

        }

        component domainLayer "Currency-Value-Object"{
            include valueObject
            include currencyVO
            include currencyCodes

            autolayout lr

        }

        component domainLayer "Money-Value-Object"{
            include valueObject
            include moneyVO
            include amountVO
            include currencyVO
            include currencyCodes

            autolayout lr

        }

        component domainLayer "Price-Value-Object"{
            include valueObject
            include priceVO
            include moneyVO

            autolayout lr

        }



        styles {

            element "value-object" {
                shape RoundedBox
                strokeWidth 2
                stroke "#000000"
            }

            element "external" {
                shape RoundedBox
                background "#ffbf00"
                color "#000000"
            }

            element "abstract" {
                shape RoundedBox
                background "#f0f0f0"
                color "#000000"
            }

            element "types" {
                shape RoundedBox
                background "#e0e0e0"
                color "#000000"
            }

            element "node-js" {
                shape RoundedBox
                background "#90C53F"
                color "#ffffff"
            }

            element "domain" {
                shape RoundedBox
                background "#438dd5"
                color "#ffffff"
            }

            element "demo" {
                shape RoundedBox
                background "#7f8c8d"
                color "#ffffff"
            }

            // Shape comes from the "value-object" tag every one of these carries.
            element "email" {
                background "#6d4c41"
                color "#ffffff"
            }

            element "money" {
                background "#4a2c8e"
                color "#ffffff"
            }

            element "amount" {
                background "#5e35b1"
                color "#ffffff"
            }

            element "currency" {
                background "#3949ab"
                color "#ffffff"
            }

            element "price" {
                background "#7e57c2"
                color "#ffffff"
            }

            relationship "external-dependency" {
                dashed true
                color "#ffbf00"
            }
        }
    }
}
