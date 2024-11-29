<div id="txLoading"> 
	<div id="txLoadingInner">
		<img id="loadingImg" src="logo.png" alt="Loading" class="loadingImg index-card-symbol">
	</div>
</div>

<style type="text/css">
	.loadingImg {
		width:150px;
		height:auto;
		animation: pulse 2s infinite ease-in-out;
	}

	#txLoading {
		position: relative;
		top:0;
		left:0;
		width:100%;
		height:100%;
	}

	#txLoadingInner {
		position: absolute;
		display:flex;
		justify-content: center;
		align-items: center;
		top: 50px;
		left: 0;
		width:100%;
		height:350px;
	}

@keyframes pulse {
    0%, 100% {
        transform: translateY(0) rotate(0deg); /* Starting and ending position */
    }
    50% {
        transform: translateY(-100px) rotate(360deg); /* Jump up and rotate at the peak */
    }
}
</style>