workspace "ValueObjects Node.js implementation" {

    model {

        bigNumber = softwareSystem "bignumber.js" "Third party library for arbitrary-precision decimal and non-decimal arithmetic" {
            tags "external"
        }

        nodeJsApp = softwareSystem "Node.js Application" {
            tags "node-js"

            domainLayer = container "Domain Layer" {
                tags "domain"

                valueObject = component "Value Object" "Abstract base class for all Value Objects" {
                    tags "abstract"
                }               

                emailVO = component "Email" "Value object for user email, ensuring format and compliance validation." {
                    tags "value-object" "email"
                }                

                moneyVO = component "Money" "A complex Value Object representing a specific monetary amount and currency." {
                    tags "value-object" "money"
                }

                amountVO = component "Amount" "Value object representing the high-precision numerical quantity of money." {
                    tags "value-object" "amount"
                }

                currencyVO = component "Currency" "Value object representing currency code." {
                    tags "value-object" "currency"
                }
            }
        }

        emailVO -> valueObject "inherits from"
        moneyVO -> valueObject "inherits from"
        currencyVO -> valueObject "inherits from"
        amountVO -> valueObject "inherits from"

        moneyVO -> amountVO "is composed of"
        moneyVO -> currencyVO "is composed of"

        amountVO -> bigNumber "uses for high-precision arithmetic" {
            tags "external-dependency"
        }
    }

    views {

        properties {
            "structurizr.locale" "en-US"
        }

        component domainLayer "Domain-Layer-Overview"{
            include *
            autolayout

        }
        
        component domainLayer "Email-Value-Object"{
            include valueObject
            include emailVO
            
            autolayout lr

        }

        component domainLayer "Money-Value-Object"{
            include valueObject
            include moneyVO
            include amountVO
            include currencyVO
            include bigNumber

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
                background #ffbf00
                color "#000000"
            }

            element "abstract" {
                shape RoundedBox
                background #f0f0f0
                color "#000000"
            }

            element "node-js" {
                shape RoundedBox
                background #90C53F
                color "#ffffff"
            }

            element "domain" {
                shape RoundedBox
                background #438dd5
                color "#ffffff"
            }

            element "email" {
                shape RoundedBox
                background #6d4c41
                color "#ffffff"
            }

            element "money" {
                shape RoundedBox
                background #4a2c8e
                color "#ffffff"
            }

            element "amount" {
                shape RoundedBox
                background #5e35b1
                color "#ffffff"
            }

            element "currency" {
                shape RoundedBox
                background #5e35b1
                color "#ffffff"
            }

            relationship "external-dependency" {
                dashed true
                color #ffbf00
            }
        }
    }
}