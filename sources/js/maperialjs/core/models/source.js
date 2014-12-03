//-----------------------------------------------------------------------------

function Source(id, type, params) {
    this.id = id;
    this.type = type;
    this.params = params;
}

//-----------------------------------------------------------------------------
// MaperialOSM public default styles

Source.MAPERIAL_BROWNIE = "maperial.brownie";
Source.MAPERIAL_CLASSIC = "maperial.classic";
Source.MAPERIAL_COOKIES = "maperial.cookies";
Source.MAPERIAL_YELLOW = "maperial.yellow";
Source.MAPERIAL_FLUO = "maperial.fluo";
Source.MAPERIAL_GREEN = "maperial.green";
Source.MAPERIAL_LIGHT = "maperial.light";
Source.MAPERIAL_PINK = "maperial.pink";

Source.MAPERIAL_BROWNIE_ID = "1_style_13ed76485efa16fefdd";
Source.MAPERIAL_CLASSIC_ID = "1_style_13ed75438c8b2ed8914";
Source.MAPERIAL_COOKIES_ID = "1_style_13e79200fc1adea5718";
Source.MAPERIAL_FLUO_ID = "1_style_13ed736f4d4bdf58b0e";
Source.MAPERIAL_GREEN_ID = "1_style_13ed6abc87adcbf3937";
Source.MAPERIAL_LIGHT_ID = "1_style_13dd0e7695bfc2941e7";
Source.MAPERIAL_PINK_ID = "1_style_13ed780ed7174481e7e";
Source.MAPERIAL_YELLOW_ID = "1_style_13ea3369f7dbbf63b42";

//-----------------------------------------------------------------------------
// Images.src

Source.MAPERIAL_EARTHLIGHT = "images.maperial.earthlight";
Source.MAPERIAL_AEROSOL = "images.maperial.aerosol";
Source.MAPERIAL_NDVI = "images.maperial.ndvi";
Source.MAPERIAL_SRTM = "images.maperial.srtm";
Source.MAPERIAL_SST = "images.maperial.sst";

Source.IMAGES_MAPQUEST = "images.mapquest";
Source.IMAGES_MAPQUEST_SATELLITE = "images.mapquest.satellite";
Source.IMAGES_OSM = "images.osm";

//http://www.thunderforest.com/
Source.IMAGES_OCM = "images.ocm.cycle";
Source.IMAGES_OCM_TRANSPORT = "images.ocm.transport";
Source.IMAGES_OCM_LANDSCAPE = "images.ocm.landscape";
Source.IMAGES_OCM_OUTDOORS = "images.ocm.outdoors";
Source.IMAGES_OCM_TRANSPORT_DARK = "images.ocm.transport.dark";

/* Map tiles by <a href="http://stamen.com">Stamen Design</a>,
 * under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>.
 * Data by <a href="http://openstreetmap.org">OpenStreetMap</a>,
 * under <a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>.
 */
// http://maps.stamen.com/
Source.IMAGES_STAMEN_WATERCOLOR = "images.stamen.watercolor";
Source.IMAGES_STAMEN_TERRAIN = "images.stamen.terrain";
Source.IMAGES_STAMEN_TONER = "images.stamen.toner";
Source.IMAGES_STAMEN_TONER_BG = "images.stamen.toner-background";

// API for business ?
// &style= 5,3 ==> possibilité plein de modifs !
//Source.IMAGES_GOOGLE_SATELLITE      = "images.google.satellite";
//Source.IMAGES_GOOGLE_TERRAIN        = "images.google.terrain";

//-----------------------------------------------------------------------------

Source.SHADE = "source.shade"; // TODO fuse with ReTiler ?
Source.RETILER = "source.ReTiler";
Source.RASTER = "source.raster"; // TODO fuse with ReTiler ?

//-----------------------------------------------------------------------------
// WMS.src

Source.WMS_BRETAGNECANTONS = "wms.bretagnecantons";
Source.WMS_FRANCECOURSDEAU = "wms.francecoursdeau";
Source.WMS_SOLS_ILEETVILAINE = "wms.sols_ileetvilaine";
Source.WMS_CORINE_LAND_COVER = "wms.corine_land_cover";

//-----------------------------------------------------------------------------

module.exports = Source;
