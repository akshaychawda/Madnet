import * as React from "react"
import { appContext } from "./AppContext"
import { authContext } from "./AuthContext"
import api from "../utils/API"

// This is the global store. Just didn't want to call it a store because I'm not sure if this is how to implement it.

export const dataContext = React.createContext({
    apiWrapper: () => {},
    getSurveyForm: () => {},
    setSurveyResponses: () => {},
    getUsers: () => {},
    getAlerts: () => {},
    setDeviceToken: () => {},
    unsetDeviceToken: () => {}
});

const { Provider } = dataContext;

const DataProvider = ({ children }) => {
    const { apiWrapper,getSurveyForm,setSurveyResponses,getUsers,getAlerts,setDeviceToken,unsetDeviceToken } = useHandler();

    return (
        <Provider value={{ apiWrapper,getSurveyForm,setSurveyResponses,getUsers,getAlerts,setDeviceToken,unsetDeviceToken }}>
            {children}
        </Provider>
    );
};

const useHandler = () => {
    const { setLoading, showError } = React.useContext(appContext)
    const [error, setError] = React.useState([])
    const { user } = React.useContext(authContext)

    const getLocalCache = (url) => {
        const key = "API:" + url
        const itemStr = localStorage.getItem(key)

        if (!itemStr) {
            return null
        }

        const item = JSON.parse(itemStr)
        const now = new Date()

        // compare the expiry time of the item with the current time
        if (now.getTime() > item.expiry) {
            // If the item is expired, delete the item from storage and return null
            localStorage.removeItem(key)
            return null
        }
        return item.data
    }

    const setLocalCache = (url, data) => {
        const now = new Date()
        const item = {
            data: data,
            expiry: now.getTime() + (1000 * 60 * 60 * 24) // Expires in a day
        }
        window.localStorage.setItem("API:" + url, JSON.stringify(item))
    }

    /// An API wrapper to make th calls.
    const apiWrapper = async(user_args) => {
        const default_args = {
            url: "",
            type: "rest",
            method: "get",
            params: false,
            graphql: "",
            name: user_args.url.split(/[\/\?\(]/)[0],
            key: user_args.url.split(/[\/\?\()]/)[0],
            cache: true
        }
        let call_response
        const args = { ...default_args, ...user_args} // Merge both array - so that we have default values

        // See if it exists in Cache first.
        if(args.type === "rest" && args.method === "get" && args.cache === true) {
            let data = getLocalCache(args.url)
            if(data) return data
        }

        setLoading(true)
        try {
            if(args.type === "rest") {
                call_response = await api.rest(args.url, args.method, args.params)
            }
        } catch(e) {
            showError(`${args.name} ${args.method} call failed: ${e.message}`, "error")
        }
        setLoading(false)

        let data = false 
        if(call_response[args.key] !== undefined) {
            data = call_response[args.key]
        } else if(Object.keys(call_response).length === 1) {
            data = call_response[Object.keys(call_response)[0]]

        } else {
            setError({
                "status": "warning",
                "message": args.name + " call failed",
                "endpoint": args.url
            })
            return false
        }

        // Save fetched data to cache.
        if(args.type === "rest" && args.method === "get" && args.cache === true) {
            setLocalCache(args.url, data)
        }
        return data
    }

    const getSurveyForm = async (survey_id) => {
        setLoading(true)
        const survey_response = await api.rest(`surveys/${survey_id}`)

        if (survey_response.surveys !== undefined) {
            let survey = survey_response.surveys
            const questions_response = await api.rest(`survey_templates/${survey.survey_template_id}/categorized_questions`)

            if (questions_response.questions !== undefined) {
                survey['questions'] = questions_response.questions
                setLoading(false)
                return survey
            } else {
                setError({
                    "status": "warning",
                    "message": "Survey Questions fetch call failed",
                    "endpoint": `survey_templates/${survey.survey_template_id}/categorized_questions`
                })
                setLoading(false)
                return survey
            }
        } else {
            setError({
                "status": "error",
                "message": "Survey fetch call failed",
                "endpoint": `surveys/${survey_id}`
            })
        }
        setLoading(false)
        return false
    }

    const setSurveyResponses = async (survey_id, survey_responses) => {
        setLoading(true)
        const call_response = await api.rest(`surveys/${survey_id}/responses`, 'post', survey_responses)
        setLoading(false)

        if(call_response) return true
        return false
    }

    const getUsers = async (params) => {
        let query_parts = []
        for(let param in params) {
            query_parts.push(`${param}=${params[param]}`)
        }
        return await apiWrapper({url:`users?${query_parts.join("&")}`})
    }

    const getAlerts = async () => {
        return await apiWrapper({url:`users/${user.id}/alerts`})
    }

    const setDeviceToken = async (token, user_id) => {
        if(user_id === undefined) user_id = user.id
        return await apiWrapper({url:`users/${user_id}/devices/${token}`, "method": "post"})
    }

    const unsetDeviceToken = async (token, user_id) => {
        if(user_id === undefined) user_id = user.id
        const device_response = await api.rest(`users/${user_id}/devices/${token}`, "delete")

        if(device_response) return device_response
        return false
    }

    return {
        apiWrapper,getSurveyForm, setSurveyResponses, getUsers, getAlerts, setDeviceToken, unsetDeviceToken
    };
};

export default DataProvider;
