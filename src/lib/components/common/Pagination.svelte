<script>

import { totalBoxes, loadOffers } from "$lib/store/store";
import { ITEMS_PER_PAGE } from '$lib/common//const.js';

$: totalBoxes.subscribe(async (value) => {
  if (value == 0) return;
  if (totalItems == value) return;

  setupPagination(value);
  totalItems = value;
});

  var totalItems = 0;
  var numPages = 1;
  var offset = 0;
  var currentPageNum = 1;

  function setupPagination(totalItems) {
    if (totalItems == 0) {
      return;
    }

    numPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    currentPageNum = offset / ITEMS_PER_PAGE + 1;

    if (currentPageNum == 0) {
      currentPageNum = 1;
    }

    jQuery('.pageNum').html(currentPageNum + ' of ' + numPages);

    jQuery('.firstPage').off('click');
    jQuery('.previousPage').off('click');
    jQuery('.nextPage').off('click');
    jQuery('.lastPage').off('click');

    jQuery('.firstPageHolder').removeClass('page-link-disabled');
    jQuery('.previousPageHolder').removeClass('page-link-disabled');
    jQuery('.nextPageHolder').removeClass('page-link-disabled');
    jQuery('.lastPageHolder').removeClass('page-link-disabled');

    if (currentPageNum <= 1) {
      jQuery('.firstPageHolder').addClass('page-link-disabled');
      jQuery('.previousPageHolder').addClass('page-link-disabled');
    } else {
      jQuery('.firstPage').click(() => {
        changePage(-1);
      });
      jQuery('.previousPage').click(() => { changePage(currentPageNum - 3);
      });
    }

    if (currentPageNum >= numPages) {
      jQuery('.nextPageHolder').addClass('page-link-disabled');
      jQuery('.lastPageHolder').addClass('page-link-disabled');
    } else {
      jQuery('.nextPage').click(() => { changePage(currentPageNum - 1);
      });
      jQuery('.lastPage').click(() => { changePage(numPages - 2);
      });
      }
    }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function enterPageNum(e) {
    let num = prompt('Enter page number:');

    if (isNaN(num) || num == null || num == currentPageNum) {
      return;
    }

    num = clamp(num, 1, numPages) - 2;

    changePage(num);

    e.preventDefault();
  }

  function changePage(num) {
    console.log('cp', num);
    return;

    offset = (num + 1) * ITEMS_PER_PAGE   
    loadOffers(offset);
    setupPagination(totalItems);
  }

</script>

<div class="h-full flex flex-col grow text-center">
  <nav id="pagination" aria-label="Page navigation">
  <ul class="pagination justify-content-center">
    <li id="" class="page-item firstPageHolder">
      <a id="" class="page-link firstPage" href="#" aria-label="Previous">
        <span aria-hidden="true">&laquo;</span>
      </a>
    </li>
    <li id="" class="page-item previousPageHolder">
      <a id ="" class="page-link previousPage" href="#" aria-label="Previous">
        <span aria-hidden="true">&lsaquo;</span>
      </a>
    </li>
    <li style="cursor: pointer;" class="page-item"><a id="" class="page-link pageNum" style="color: var(--text-white) !important;" on:click={enterPageNum}>1 of 1</a></li>
    <li id="" class="page-item nextPageHolder">
      <a id="" class="page-link nextPage" href="#" aria-label="Next">
        <span aria-hidden="true">&rsaquo;</span>
      </a>
    </li>
    <li id="" class="page-item lastPageHolder">
      <a id="" class="page-link lastPage" href="#" aria-label="Next">
        <span aria-hidden="true">&raquo;</span>
      </a>
    </li>
  </ul>
</nav>
</div>

<style>
  .page-link {
    padding: 12px 17px;
    border: 0 !important;
    background: var(--forms-bg) !important;
    color: var(--main-color) !important;
  }

  .page-link-disabled, .page-link {
    color: var(--text-light) !important;
    cursor: default !important;
    pointer-events: none;
    user-select: none;
  }

  .page-link:focus {
    box-shadow: none;
    border: 1px solid var(--main-color) !important;
  }
</style>