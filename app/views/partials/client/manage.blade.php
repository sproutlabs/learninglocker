@extends('layouts.master')

@section('sidebar')
  @include('partials.lrs.sidebars.lrs')
@stop


@section('content')

  @include('partials.site.elements.page_title', array('page' => trans('lrs.client.manageclients')))

  <div>
     <div class="alert alert-success clearfix">
      <div class="col-sm-10">
        <b>{{ trans('lrs.endpoint.endpoint') }}:</b> <span class="break-words">{{ URL() }}/data/xAPI/</span>
      </div>
    </div>
    <div>

    @if ( isset($clients) && !empty($clients) )

      <table class="table table-bordered">
        <thead>
          <tr>
            <th>{{trans('site.name')}}</th>
            <th>{{trans('site.username')}}</th>
            <th>{{trans('site.password')}}</th>
            <th>{{trans('site.edit')}}</th>
            <th>{{trans('site.delete')}}</th>
          <tr>
        </thead>
        <tbody>
          @foreach( $clients as $client )
              @include('partials.client.item', array( 'client' => $client ))
          @endforeach
        </tbody>
      </table>

    @endif

    @if ( count($clients) == 0 )
      <div class="col-xs-12 col-sm-12 col-lg-12">
        <p class="bg-warning">{{trans('lrs.client.none')}}</p>
      </div>
    @endif

    @include('partials.client.forms.create')

  </div>
  </div>

@stop