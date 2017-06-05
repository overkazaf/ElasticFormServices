import fetch from 'isomorphic-fetch';


export default
class CommitEngine {

	static formInfo = null;

	static init(info) {
		CommitEngine.formInfo = info;
	}

	static validateForm(model) {
		return true;
	}

	static submitForm(model) {
		let {
			formId,
			submitter,
		} = CommitEngine.formInfo;

		// combine model
		let dataModel = {
			formId,
			submitter,
			createDate: +new Date(),
			model,
		};
		CommitEngine.doSubmit(dataModel);
	}

	static doSubmit(dataModel) {

		let submitUrl = `http://localhost:3000/form/submit`;

		console.log('dataModel', dataModel);
		
		fetch(submitUrl, {
			method: 'POST',
			headers: { 
				'Accept': 'application/json',
				'Content-Type': 'application/json' 
			},
			body: JSON.stringify({data: dataModel})
		})
			.then(function(response) {
		        if (response.status >= 400) {
		            throw new Error("Bad response from server");
		        }
		        return response.json();
		    })
		    .then(function(stories) {
		        console.log(stories);
		    });

		//console.log('models in CommitEngine', dataModel);
	}
}